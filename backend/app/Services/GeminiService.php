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
            Task: Convert the user's natural language question into a VALID MySQL query based on the provided schema.
            Task: Convert the user's natural language question into a VALID MySQL query based on the provided schema.
            
            DATABASE STRATEGY (How to Join Tables):
            1. The `enrollments` table is the CENTRAL HUB. Almost all queries must start here or join through here.
            2. MANDATORY SELECT COLUMNS: For any query that returns a list of data (not COUNT), you MUST ALWAYS include:
                - `students`.`student_id`
                - Full Name (use CONCAT_WS(' ', first_name, middle_name, last_name))
                - `sections`.`name` as section
                - `classes`.`grade`
                Therefore, ALWAYS JOIN `students`, `sections`, and `classes` on their respective IDs in `enrollments`.
            3. To get Academic details, JOIN `school_years`, `sections`, `classes`, `majors`, `semesters`, `programs` using their respective IDs in `enrollments`.
            4. PAYMENT & DISCOUNT LOGIC (CRITICAL): 
                - PAYMENT: To check payment methods ('installment', 'full payment'), it depends on residence type.
                    ALWAYS JOIN `residence_halls` rh ON `enrollments`.`residence_id` = rh.`residence_id` AND JOIN `payments` p ON `enrollments`.`enrollment_id` = p.`enrollment_id`.
                    IF rh.`type` = 'Non-Residence hall', check `p`.`tuition_fees`.
                    IF rh.`type` IN ('Boys dormitory', 'Girls dormitory'), check `p`.`residence_payment`.
                - DISCOUNT: ALWAYS JOIN `student_discounts` sd ON `enrollments`.`enrollment_id` = sd.`enrollment_id` JOIN `discount_types` dt ON sd.`discount_type_id` = dt.`discount_type_id`.
                    Match the discount category (e.g., 'Staff', 'Beasiswa') in `dt`.`name`.
                    Match the specific amount or details (e.g., '12%', 'November') using LIKE in `sd`.`notes`.          
            5. For 'Hari ini' (Today), use DATE(enrollments.registration_date) = CURDATE().
            6. FILTERING MASTER DATA: NEVER hardcode IDs (like class_id = 3). ALWAYS JOIN the master table and filter by its string column using LIKE or =. 
                (Example: To find grade K2, use JOIN `classes` c ... WHERE c.`grade` = 'K2').
            7. MULTIPLE CATEGORY RECAPITULATION (CRITICAL): If the user asks for a 'Rekapitulasi' (Summary/Recap) based on MULTIPLE INDEPENDENT categories:
                - DO NOT group them all in one SELECT. Use `UNION ALL` to create a vertical table with 3 columns: `Kategori`, `Kriteria`, and `Total`.
                - ALWAYS use Standard English for the 'Kategori' string literals, REGARDLESS of the user's language (e.g., use 'Residence Type' NOT 'Tipe Tempat Tinggal', use 'Payment', 'Grade', 'Discount', 'Student Status', 'Gender', 'Academic Status', 'School Year').
                - If the user ALSO asks for 'nama' (names) or a specific list of students alongside the recap, do NOT put names in the UNION ALL. Instead, add a 3rd query in the JSON array specifically for the student list.
            8. DISAMBIGUATE STATUS:
                - If checking Enrollment Status ('New', 'Old', or 'Transferee'), ALWAYS use `enrollments`.`student_status`.
                - If checking Lifecycle Status ('Withdraw', 'Expelled', 'Graduate', or 'Not Graduate'), ALWAYS use `students`.`status`.
    
            Constraints:
            - Output ONLY the raw JSON Array: [\"SQL 1\", \"SQL 2\"]. No Markdown formatting like ```json or ```sql, no explanations.
            - Output ONLY the raw JSON Array: [\"SQL 1\", \"SQL 2\"]. No Markdown formatting like ```json or ```sql, no explanations.
            - If the request cannot be answered with the schema, return SELECT 'I cannot answer that based on the available data' as message.
            - ARRAY STRUCTURE RULE (2 OR 3 QUERIES): You must return exactly 2 or 3 queries depending on the request:
                * Index 0 (Mandatory): A query to get the EXACT DISTINCT COUNT of students (e.g., `SELECT COUNT(DISTINCT e.enrollment_id) as total_siswa ...`).
                * Index 1 (Mandatory): The primary response query (`SELECT ... LIMIT 50` OR the `UNION ALL` summary table).
                * Index 2 (Conditional): ONLY IF the user asks for BOTH a recapitulation/summary AND a detailed list of names/data. Put the `UNION ALL` in Index 1, and the detailed data query (`SELECT s.student_id, full_name ... LIMIT 50`) in Index 2.
            - Use ONLY SELECT statements. UPDATE/DELETE/INSERT are strictly forbidden.
            - ALWAYS add LIMIT 50 for data listing queries (index 1), unless the user asks for a specific limit. Do NOT limit COUNT queries.

            EXAMPLES:
            Example 1 (Complex Conditional Payment & Discount Join):
            User Question: 'Siapa saja siswa yang mendaftar hari ini dengan pembayaran installment dan mendapatkan diskon staff 12%. berikan total dan datanya'
            Output: [
                \"SELECT COUNT(*) as total_siswa FROM enrollments e JOIN students s ON e.id = s.id JOIN residence_halls rh ON e.residence_id = rh.residence_id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND ( (rh.type = 'Non-Residence hall' AND p.tuition_fees LIKE '%installment%') OR (rh.type IN ('Boys dormitory', 'Girls dormitory') AND p.residence_payment LIKE '%installment%') ) AND dt.name = 'Staff' AND sd.notes LIKE '%12%%'\",
                \"SELECT s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name, sec.name as section, c.grade, rh.type as residence_type, p.tuition_fees, p.residence_payment, dt.name as discount_type, sd.notes as discount_notes FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN residence_halls rh ON e.residence_id = rh.residence_id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND ( (rh.type = 'Non-Residence hall' AND p.tuition_fees LIKE '%installment%') OR (rh.type IN ('Boys dormitory', 'Girls dormitory') AND p.residence_payment LIKE '%installment%') ) AND dt.name = 'Staff' AND sd.notes LIKE '%12%%' LIMIT 50\"
            ]

            Example 2 (Multiple Independent Categories Recap using UNION ALL):
            User Question: 'Buatkan rekapitulasi pendaftaran hari ini berdasarkan tipe tempat tinggal, kelas, dan gender'
            Output: [
                \"SELECT COUNT(DISTINCT e.enrollment_id) as total_pendaftar FROM enrollments e WHERE DATE(e.registration_date) = CURDATE()\",
                \"SELECT 'Residence Type' AS Kategori, rh.type AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN residence_halls rh ON e.residence_id = rh.residence_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY rh.type UNION ALL SELECT 'Grade' AS Kategori, c.grade AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN classes c ON e.class_id = c.class_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY c.grade UNION ALL SELECT 'Gender' AS Kategori, s.gender AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN students s ON e.id = s.id WHERE DATE(e.registration_date) = CURDATE() GROUP BY s.gender\"
            ]

            Example 3 (Year and Pickup Point Filtering):
            User Question: 'Berapa jumlah siswa yang mendaftar untuk tahun ajaran 2026/2027 dengan pickup point Airmadidi? berikan beserta list datanya'
            Output: [
                \"SELECT COUNT(*) as total_siswa FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%'\",
                \"SELECT s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name, sec.name as section, c.grade, sy.year as school_year, pp.name as pickup_point FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' LIMIT 50\"
            ]
            
            Example 4 (Recap AND List of Names requested together):
            User Question: 'Buatkan rekap pendaftaran hari ini berdasarkan tipe tempat tinggal dan kelas, berikan juga list namanya'
            Output: [
                \"SELECT COUNT(DISTINCT e.enrollment_id) as total_pendaftar FROM enrollments e WHERE DATE(e.registration_date) = CURDATE()\",
                \"SELECT 'Residence Type' AS Kategori, rh.type AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN residence_halls rh ON e.residence_id = rh.residence_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY rh.type UNION ALL SELECT 'Grade' AS Kategori, c.grade AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN classes c ON e.class_id = c.class_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY c.grade\",
                \"SELECT s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name, sec.name as section, c.grade, rh.type as residence_type FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN residence_halls rh ON e.residence_id = rh.residence_id WHERE DATE(e.registration_date) = CURDATE() LIMIT 50\"
            ]

            Schema:
            {$dbSchema}
        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->post("{$this->baseUrl}?key={$this->apiKey}", [
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

            $start = strpos($generatedText, '[');
            $end = strrpos($generatedText, ']');

            if ($start !== false && $end !== false) {
                // Potong string HANYA dari '[' sampai ']'
                $cleanJson = substr($generatedText, $start, $end - $start + 1);
            } else {
                $cleanJson = $generatedText; 
            }
            $start = strpos($generatedText, '[');
            $end = strrpos($generatedText, ']');

            if ($start !== false && $end !== false) {
                // Potong string HANYA dari '[' sampai ']'
                $cleanJson = substr($generatedText, $start, $end - $start + 1);
            } else {
                $cleanJson = $generatedText; 
            }

            // Decode menjadi array PHP
            $queries = json_decode($cleanJson, true);
            
            // Fallback jika json_decode gagal
            // Fallback jika json_decode gagal
            if (!is_array($queries)) {
                Log::warning('Failed to parse AI JSON. Raw output: ' . $generatedText);
                return [$cleanJson];
                Log::warning('Failed to parse AI JSON. Raw output: ' . $generatedText);
                return [$cleanJson];
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
            ? "The system will display TABLE(S) below your response. YOUR TASK: First, find the actual total number of students/registrations. This is usually the value inside the FIRST query result. State this explicitly (e.g., 'Terdapat total 6 pendaftaran...'). WARNING: If the table is a 'UNION ALL' summary table, DO NOT use 'total_rows_in_db' as the number of students. Second, write a brief, natural introductory sentence for the table(s). If there is a summary table AND a student list table, briefly introduce both."
            : "The result is a direct answer or summary. Provide a conversational narrative based on the data without introducing any table.";
        
        $systemInstruction = "
            Role: You are a helpful Data Analyst Assistant for MIS Registrar.
            Role: You are a helpful Data Analyst Assistant for MIS Registrar.
            
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
            5. TERMINOLOGY RULE: When mentioning column names, keep them in their natural academic English terms (e.g., use 'Residence Type' instead of 'Tipe Hunian', 'Grade', 'Section', 'Installment'). Do not literally translate technical schema names.
            5. TERMINOLOGY RULE: When mentioning column names, keep them in their natural academic English terms (e.g., use 'Residence Type' instead of 'Tipe Hunian', 'Grade', 'Section', 'Installment'). Do not literally translate technical schema names.

            General Rules:
            - Be friendly and professional.
            - Do NOT mention 'SQL', 'Query', or 'JSON'. Talk about the data directly.
        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->retry(3, 2000)->post("{$this->baseUrl}?key={$this->apiKey}", [
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