<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GeminiService;
use App\Services\AiSchemaService;
use App\Services\ChatSessionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException;
use App\Services\DailyReportService;

class AiChatController extends Controller
{
    protected $schemaService;
    protected $geminiService;
    protected $chatSessionService;
    protected $dailyReportService;

    public function __construct(AiSchemaService $schemaService, GeminiService $geminiService, ChatSessionService $chatSessionService, DailyReportService $dailyReportService)
    {
        $this->schemaService = $schemaService;
        $this->geminiService = $geminiService;
        $this->chatSessionService = $chatSessionService;
        $this->dailyReportService = $dailyReportService;
    }

    public function ask(Request $request)
    {
        set_time_limit(0);
        
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
            $this->chatSessionService->saveMessage($sessionId, 'system', $errorMsg);
            
            return response()->json([
                'success' => false,
                'message' => $errorMsg,
                'session_id' => $sessionId,
                'title' => $sessionData['title'] ?? 'Percakapan Baru', 
                'display_type' => 'text', 
                'data' => null
            ], 400);
        }

        try{
            $executionResults = [];
            $tableData = []; 
            $isTable = false;
            $sqlTextLog = "";
            $sqlQueries = [];
            $totalDataCount = 0;
            
            // Untuk Menentukan Jenis Proses
            $defaultRekapanPrompt = 'Berikan data rekapan pendaftaran untuk hari ini dalam bentuk tabel';
            $isDailyReport = trim(strtolower($prompt)) === strtolower($defaultRekapanPrompt);

            // JALUR 1: DAILY REPORT (HARDCODED QUERY)
            if ($isDailyReport) {
                $dailyData = $this->dailyReportService->getTodayRecap();
                
                // Tambahkan Comparative Array ke dalam JSON 'data'
                $tableData = [
                    $dailyData['summary'], 
                    $dailyData['details'],
                    $dailyData['comparative']
                ];
                
                $totalDataCount = $dailyData['total'] ?? 0;
                
                if ($totalDataCount > 0) {
                    $isTable = true;
                }

                $sqlQueries = ['DAILY_REPORT_SUMMARY', 'DAILY_REPORT_LIST', 'DAILY_REPORT_COMPARATIVE'];
                $sqlTextLog = "EXECUTE: DailyReportService->getTodayRecap()";

                // Format data untuk Gemini
                $executionResults[] = [
                    'query_order' => 1,
                    'sql_used' => 'DAILY_REPORT_SUMMARY',
                    'total_rows_in_db' => count($dailyData['summary']),
                    'result' => $dailyData['summary'] 
                ];

                $executionResults[] = [
                    'query_order' => 2,
                    'sql_used' => 'DAILY_REPORT_LIST',
                    'total_rows_in_db' => count($dailyData['details']),
                    'result' => $dailyData['details'] 
                ];
                
                $executionResults[] = [
                    'query_order' => 3,
                    'sql_used' => 'DAILY_REPORT_COMPARATIVE',
                    'total_rows_in_db' => count($dailyData['comparative']),
                    'result' => $dailyData['comparative'] 
                ];

            // JALUR 2: NORMAL PROMPT (AI GENERATED SQL)
            } else {

                // 3. Ambil Schema & Generate SQL
                $schema = $this->schemaService->getSchema();
                $sqlQueries = $this->geminiService->generateSQL($prompt, $schema);
    
                // Ubah array SQL menjadi text biasa yang dipisahkan titik koma & baris baru
                $sqlTextLog = is_array($sqlQueries) ? implode(";\n\n", $sqlQueries) : $sqlQueries;
    
                // 4. Eksekusi SQL
                foreach ($sqlQueries as $index => $sql) {
                    // Validation for Security
                    $upperSql = strtoupper($sql);
                    if (preg_match('/^\s*(DELETE|UPDATE|INSERT|DROP|ALTER)\b/i', $sql)) {
                        
                        $forbiddenMsg = 'Maaf, Action Forbidden. Sistem hanya mengizinkan pencarian data.';
                        $this->chatSessionService->saveMessage($sessionId, 'system', $forbiddenMsg, $sqlTextLog);
    
                        return response()->json([
                            'success' => false,
                            'message' => $forbiddenMsg,
                            'session_id' => $sessionId,
                            'title' => $sessionData['title'] ?? 'Percakapan Baru', 
                            'display_type' => 'text',
                            'data' => null
                        ], 403);
                    }
    
                    // Query menggunakan READ-ONLY
                    try {
                        $results = DB::connection('mysql_readonly')->select($sql);
    
                        $resultsArray = array_map(function ($value) {
                            return (array) $value;
                        }, $results);
    
                        $rowCount = count($resultsArray);
    
                        if ($rowCount > 0 && isset($resultsArray[0]['error_message'])) {
                            $customErrorMsg = $resultsArray[0]['error_message'];
                            
                            $this->chatSessionService->saveMessage($sessionId, 'system', $customErrorMsg, $sqlTextLog);
                            
                            return response()->json([
                                'success' => false,
                                'message' => $customErrorMsg,
                                'session_id' => $sessionId,
                                'title' => $sessionData['title'] ?? 'Percakapan Baru',
                                'display_type' => 'text',
                                'data' => null
                            ], 400); 
                        }

                        $executionResults[] = [
                            'query_order' => $index + 1,
                            'sql_used' => $sql,
                            'total_rows_in_db' => $rowCount,
                            'result' => $resultsArray
                        ];
    
                        if ($rowCount > 0) {
                            $firstRow = $resultsArray[0];
                            if (count($firstRow) > 1) {
                                $tableData[] = $resultsArray;
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
            }

            // Jika hasil query benar-benar kosong/tidak valid
            if (empty($executionResults) || empty($tableData)) {
                $emptyMsg = 'Maaf, data tidak ditemukan atau kosong.';
                $this->chatSessionService->saveMessage($sessionId, 'system', $emptyMsg, $sqlTextLog);
                
                return response()->json([
                    'success' => false, 
                    'message' => $emptyMsg,
                    'session_id' => $sessionId,
                    'title' => $sessionData['title'] ?? 'Percakapan Baru',
                    'display_type' => 'text',
                    'data' => null
                ], 200); 
            }

            // Hitung Total Data (Jalur Normal)
            if (!$isDailyReport) {
                if (!empty($executionResults) && isset($executionResults[0]['result'][0])) {
                    $firstRow = $executionResults[0]['result'][0];
                    $totalDataCount = (int) current($firstRow);
                }
            }


            // Sorting khusus hanya untuk jalur normal
            if (!$isDailyReport) {
                foreach($tableData as &$table) {
                    if (!empty($table) && isset($table[0]['registration_date'])) {
                        usort($table, function ($a, $b) {
                            return strtotime($a['registration_date'] ?? 0) - strtotime($b['registration_date'] ?? 0);
                        });
                    }
                }
            }


            // 5. Interpretasi Naratif AI
            $humanAnswer = $this->geminiService->interpretResult(
                $request->prompt,
                $executionResults, 
                $isTable
            );
            
            $backendPayload = json_encode([
                'can_download' => $isTable,
                'tableData'    => $tableData,
                'totalCount'   => $totalDataCount,
                'is_daily_report_format' => $isDailyReport
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $this->chatSessionService->saveMessage($sessionId, 'backend', $backendPayload, $sqlTextLog);

            // 6. Simpan hasil akhir (Naratif AI & SQL) ke Database
            $this->chatSessionService->saveMessage($sessionId, 'AI', $humanAnswer, null);

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'title' => $sessionData['title'], 
                'message' => $humanAnswer, 
                'display_type' => $isTable ? 'table' : 'text', 
                'data' => $tableData,
                'meta' => [
                    'prompt' => $request->prompt,
                    'executed_queries' => $sqlQueries,
                    'total_count' => $totalDataCount,
                    'is_daily_report_format' => $isDailyReport 
                ]
            ]);

        } catch (\Throwable $e) {
            Log::error('AI Chat Error: ' . $e->getMessage() . ' di baris ' . $e->getLine());
            $sysErrorMsg = 'Terjadi kesalahan sistem: ' . $e->getMessage();
            $this->chatSessionService->saveMessage($sessionId, 'system', $sysErrorMsg);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memproses permintaan Anda.',
                'session_id' => $sessionId,
                'title' => $sessionData['title'] ?? 'Percakapan Baru'
            ], 500);
        }
    }
}