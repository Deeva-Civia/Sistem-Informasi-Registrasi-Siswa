<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use App\Services\GeminiService;
use App\Services\AiSchemaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class AiChatController extends Controller
{
    protected $schemaService;
    protected $geminiService;

    public function __construct(AiSchemaService $schemaService, GeminiService $geminiService)
    {
        $this->schemaService = $schemaService;
        $this->geminiService = $geminiService;
    }

    public function ask(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:500',
        ]);

        try{
            $schema = $this->schemaService->getSchema();
            $sqlQueries = $this->geminiService->generateSQL($request->prompt, $schema);

            $executionResults = [];
            $tableData = []; 
            $isTable = false;

            foreach ($sqlQueries as $index => $sql) {
                // Validation for Security
                $upperSql = strtoupper($sql);
                if (str_contains($upperSql, 'DELETE') || str_contains($upperSql, 'UPDATE') ||
                    str_contains($upperSql, 'INSERT') || str_contains($upperSql, 'DROP') ||
                    str_contains($upperSql, 'ALTER')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Action forbidden.'
                    ], 403);
                }

                // Query menggunakan READ-ONLY
                try {
                    $results = DB::connection('mysql_readonly')->select($sql);

                    $resultsArray = array_map(function ($value) {
                        return (array) $value;
                    }, $results);

                    $executionResults[] = [
                        'query_order' => $index + 1,
                        'sql_used' => $sql,
                        'result' => $resultsArray
                    ];

                    $rowCount = count($resultsArray);
                    if ($rowCount > 0) {
                        $firstRow = $resultsArray[0];
                        if (count($firstRow) > 1) {
                            $tableData =  array_merge($tableData, $resultsArray);
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

            if (!empty($tableData)) {
                usort($tableData, function ($a, $b) {
                    return strtotime($b['registration_date'] ?? 0) - strtotime($a['registration_date'] ?? 0);
                });
            }
            
            if (empty($executionResults)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Tidak ada query yang valid untuk dijalankan.'
                ], 400);
            }

            $humanAnswer = $this->geminiService->interpretResult(
                $request->prompt,
                $executionResults, 
                $isTable
            );
            
            return response()->json([
                'success' => true,
                'message' => $humanAnswer, 
                'display_type' => $isTable ? 'table' : 'text', 
                'data' => $tableData, 
                'meta' => [
                    'prompt' => $request->prompt,
                    'executed_queries' => $sqlQueries
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }
}
