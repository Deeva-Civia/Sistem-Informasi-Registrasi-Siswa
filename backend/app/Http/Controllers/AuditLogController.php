<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        try {
            $logs = AuditLog::with('user:user_id,username,full_name,email,role')
                ->when($request->action, fn($q) => $q->where('action', $request->action))
                ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
                ->latest()
                ->paginate(25);
    
            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('AuditLog Index Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $log = AuditLog::with('user:user_id,username,full_name,email,role')->findOrFail($id);
    
            return response()->json([
                'success' => true,
                'data' => $log
            ]);
        } catch (\Exception $e) {
            Log::error('AuditLog Show Error: ' . $e->getMessage(), [
                'id_requested' => $id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Audit log not found.',
                    'error' => null
                ], 404);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit log details.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
