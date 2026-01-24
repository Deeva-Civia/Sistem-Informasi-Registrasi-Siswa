<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY'); 
        $this->baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    public function generateSQL(string $userPrompt, string $dbSchema)
    {
        $systemInstruction = "
            Role: You are an expert SQL Generator for MySQL.
            Task: Convert the user's question into a VALID MySQL query based on the provided schema.
            
            STRATEGY (How to choose tables):
            1. CASE: User asks for 'List of Registrations', 'Count of Applicants', or 'Today's Registrations'.
                -> ACTION: Use the `view_registrations_mixed` table. It's faster and pre-joined.
            2. CASE: User asks for specific details (Parents, Address, Payments) or specific conditions not in the view.
                -> ACTION: Build a standard JOIN query using `students`, `enrollments`, `parents`, etc.
            3. CASE: User asks for 'Data Pendaftar' (The List) AND 'Total'.
                -> ACTION: Return TWO queries. 
                    a. `SELECT COUNT(*) FROM view_registrations_mixed WHERE ...`
                    b. `SELECT * FROM view_registrations_mixed WHERE ... LIMIT 50`
            
            Constraints:
            - Output ONLY the raw JSON Array: [\"SQL 1\", \"SQL 2\"]. No Markdown, no explanations.
            - Use the table and column names provided in the Schema explicitly.
            - If the request cannot be answered with the schema, return SELECT 'I cannot answer that based on the available data' as message.
            - Use ONLY SELECT statements. UPDATE/DELETE/INSERT are strictly forbidden.
            - Always use LIMIT 50 for data listing queries, Except user want spesifik total data listing queries (not for COUNT queries).

            Schema:
            {$dbSchema}
        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemInstruction . "\n\nUser Question: " . $userPrompt]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error: ' . $response->body());
                throw new Exception('Gagal menghubungi AI Service.');
            }

            $responseData = $response->json();
            $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Bersihkan output jika Gemini kasih markdown
            $cleanJson = str_replace(['```sql', '```', "\n"], ['','',' '], $generatedText);

            // Decode menjadi array PHP
            $queries = json_decode($cleanJson, true);
            
            if (!is_array($queries)) {
                return [trim($cleanJson)];
            }

            return $queries;

        } catch (Exception $e) {
            Log::error($e->getMessage());
            throw $e;
        }
    }

    public function interpretResult(string $userPrompt, array $executionResults, bool $hasTableData)
    {
        foreach ($executionResults as &$item) {
            if (is_array($item['result']) && count($item['result']) > 3) {
                $item['result_sample'] = array_slice($item['result'], 0, 3);
                unset($item['result']); 
            }
        }

        $contextJson = json_encode($executionResults);

        $specificRule = $hasTableData 
            ? "The system will display a TABLE UI for the list data. Your job is to summarize the findings (especially the counts) and introduce the table. DO NOT list the table items manually."
            : "The result is a direct answer (value/summary). Answer naturally.";
        
        // if ($isTable) {
        //     $specificRule = "
        //         The system will display a TABLE UI below your response.
                
        //         YOUR TASK:
        //         1. If the user asked for a COUNT/TOTAL (e.g., 'how many', 'berapa'), YOU MUST ANSWER that specific number first based on the 'Total Rows Metadata' provided below.
        //         2. Then, provide a short introductory sentence for the table (e.g., 'Berikut adalah rincian datanya:').
        //         3. DO NOT list the data items manually in the text, because the Table UI will handle it.
        //     ";
        // } else {
        //     $specificRule = "The result is a single value or summary. You MUST answer the user's question naturally based on this value.";
        // }

        $systemInstruction = "
            Role: You are a helpful Data Analyst Assistant.
            
            Context:
            - User Question: '$userPrompt'
            - Database Execution Results: $contextJson
            - Is Table Displayed: " . ($hasTableData ? 'YES' : 'NO') . "

            Task:
            $specificRule
            
            Language Rules:
            1. DETECT the language of the 'User Question'.
            2. If the user asks in English, you MUST answer in English.
            3. If the user asks in Indonesian, you MUST answer in Indonesian.
            4. Do not mix languages.

            General Rules:
            - Be friendly and professional.
            - Do NOT mention 'SQL', 'Query', or 'JSON'. Talk about the data directly.
        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->retry(3, 2000)->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemInstruction]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini Interpretation Error: ' . $response->body());
                return "Error processing interpretation."; 
            }

            $responseData = $response->json();
            return $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'No response.';

        } catch (Exception $e) {
            Log::error($e->getMessage());
            return "Terjadi kesalahan saat memproses jawaban.";
        }
    }
}