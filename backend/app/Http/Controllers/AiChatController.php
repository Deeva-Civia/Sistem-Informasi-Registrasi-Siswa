<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use App\Services\GeminiService;
use App\Services\AiSchemaService;
use App\Services\ChatSessionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException;

class AiChatController extends Controller
{
    protected $schemaService;
    protected $geminiService;
    protected $chatSessionService;

    public function __construct(AiSchemaService $schemaService, GeminiService $geminiService, ChatSessionService $chatSessionService)
    {
        $this->schemaService = $schemaService;
        $this->geminiService = $geminiService;
        $this->chatSessionService = $chatSessionService;
    }

    public function ask(Request $request)
    {
        $prompt = $request->input('prompt');
        $inputSessionId = $request->input('session_id');
        $userId = auth()->id();

        // 1. Tangani Session & Simpan Pesan User
        $sessionData = $this->chatSessionService->handleSession($inputSessionId, $prompt ?? '', $userId);
        $sessionId = $sessionData['session_id'];

        $this->chatSessionService->saveMessage($sessionId, 'user', $prompt ?? '');

        // 2. Validasi Prompt
        $validator = Validator::make($request->all(), [
            'prompt' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            $errorMsg = 'Pesan tidak valid atau melebihi 500 karakter.';
            $this->chatSessionService->saveMessage($sessionId, 'backend', $errorMsg);
            
            return response()->json([
                'success' => false,
                'message' => $errorMsg,
                'session_id' => $sessionId
            ], 400);
        }

        try{
            // 3. Ambil Schema & Generate SQL
            $schema = $this->schemaService->getSchema();
            $sqlQueries = $this->geminiService->generateSQL($prompt, $schema);

            // Ubah array SQL menjadi text biasa yang dipisahkan titik koma & baris baru
            $sqlTextLog = is_array($sqlQueries) ? implode(";\n\n", $sqlQueries) : $sqlQueries;

            $executionResults = [];
            $tableData = []; 
            $isTable = false;

            // 4. Eksekusi SQL
            foreach ($sqlQueries as $index => $sql) {
                // Validation for Security
                $upperSql = strtoupper($sql);
                if (str_contains($upperSql, 'DELETE') || str_contains($upperSql, 'UPDATE') ||
                    str_contains($upperSql, 'INSERT') || str_contains($upperSql, 'DROP') ||
                    str_contains($upperSql, 'ALTER')) {
                    
                    $forbiddenMsg = 'Action forbidden. Coba kalimat lain.';
                    $this->chatSessionService->saveMessage($sessionId, 'backend', $forbiddenMsg, $sqlTextLog);

                    return response()->json([
                        'success' => false,
                        'message' => $forbiddenMsg,
                        'session_id' => $sessionId
                    ], 403);
                }

                // Query menggunakan READ-ONLY
                try {
                    $results = DB::connection('mysql_readonly')->select($sql);

                    $resultsArray = array_map(function ($value) {
                        return (array) $value;
                    }, $results);

                    $rowCount = count($resultsArray);

                    $executionResults[] = [
                        'query_order' => $index + 1,
                        'sql_used' => $sql,
                        'total_rows_in_db' => $rowCount,
                        'result' => $resultsArray
                    ];

                    if ($rowCount > 0) {
                        $firstRow = $resultsArray[0];
                        if (count($firstRow) > 1) {
                            $tableData['table_' . $index] = $resultsArray;
                            $isTable = true;
                        }
                    }

                } catch (QueryException $e) {
                    Log::warning("AI SQL Error at query #$index: " . $e->getMessage());
                    
                    $executionResults[] = [
                        'query_order' => $index + 1,
                        'error' => 'Failed to execute'
                    ];
                }
            }

            // Jika hasil query benar-benar kosong/tidak valid
            if (empty($executionResults) || empty($tableData)) {
                $emptyMsg = 'Maaf, data tidak ditemukan atau kosong.';
                $this->chatSessionService->saveMessage($sessionId, 'backend', $emptyMsg, $sqlTextLog);
                
                return response()->json([
                    'success' => false, 
                    'message' => $emptyMsg,
                    'session_id' => $sessionId
                ], 404); 
            }

            // Sorting khusus 
            foreach($tableData as &$table) {
                usort($table, function ($a, $b) {
                    return strtotime($b['registration_date'] ?? 0) - strtotime($a['registration_date'] ?? 0);
                });
            }

            // 5. Interpretasi Naratif AI
            $humanAnswer = $this->geminiService->interpretResult(
                $request->prompt,
                $executionResults, 
                $isTable
            );
            
            // 6. Simpan hasil akhir (Naratif AI & SQL) ke Database
            $this->chatSessionService->saveMessage($sessionId, 'AI', $humanAnswer, $sqlTextLog);

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'title' => $sessionData['title'], 
                'message' => $humanAnswer, 
                'display_type' => $isTable ? 'table' : 'text', 
                'data' => $tableData,
                'meta' => [
                    'prompt' => $request->prompt,
                    'executed_queries' => $sqlQueries
                ]
            ]);

        } catch (Exception $e) {
            $sysErrorMsg = 'Terjadi kesalahan sistem: ' . $e->getMessage();
            $this->chatSessionService->saveMessage($sessionId, 'backend', $sysErrorMsg);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memproses permintaan Anda.',
                'session_id' => $sessionId
            ], 500);
        }
    }
}
