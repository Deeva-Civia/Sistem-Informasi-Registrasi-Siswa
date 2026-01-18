<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class StorageController extends Controller
{
    public function serveFile($path)
    {
        try {
            $path = str_replace('storage/', '', $path);
            
            if (!Storage::disk('public')->exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found.',
                    'error' => null
                ], 404);
            }
    
            return Storage::disk('public')->response($path);

        } catch (\Exception $e) {
            Log::error('Storage ServeFile Error: ' . $e->getMessage(), [
                'requested_path' => $path, 
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving the file.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
