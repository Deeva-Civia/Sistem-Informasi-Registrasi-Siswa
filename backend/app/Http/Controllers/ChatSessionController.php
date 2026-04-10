<?php

namespace App\Http\Controllers;

use Throwable;
use Illuminate\Http\Request;
use App\Services\ChatSessionService;
use Illuminate\Http\JsonResponse;

class ChatSessionController extends Controller
{
    protected ChatSessionService $chatSessionService;

    public function __construct(ChatSessionService $chatSessionService)
    {
        $this->chatSessionService = $chatSessionService;
    }

    public function fetchChatDetails(Request $request, int $session_id): JsonResponse
    {
        try {
            $messages = $this->chatSessionService->fetchSessionMessages(
                $request->user()->user_id,
                $session_id
            );

            if (is_null($messages)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Chat history fetched successfully.',
                'data' => $messages,
            ]);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch chat history.',
                'errors' => config('app.debug') ? $error->getMessage() : null,
            ], 500);
        }
    }

    public function searchSessions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'keyword' => 'nullable|string|max:255',
        ]);

        try {
            $keyword = trim($validated['keyword'] ?? '');
            $sessions = $this->chatSessionService->searchSessions(
                $request->user()->user_id,
                $keyword
            );

            return response()->json([
                'success' => true,
                'message' => empty($sessions)
                    ? 'No chat sessions found.'
                    : 'Chat sessions fetched successfully.',
                'data' => $sessions,
            ]);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search chat sessions.',
                'errors' => config('app.debug') ? $error->getMessage() : null,
            ], 500);
        }
    }

    public function updateChatTitle(Request $request, int $session_id): JsonResponse
    {
        $validated = $request->validate([
            'new_title' => 'required|string|max:255',
        ]);

        try {
            $updatedSession = $this->chatSessionService->renameSession(
                $request->user()->user_id,
                $session_id,
                $validated['new_title']
            );

            if (is_null($updatedSession)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Chat title updated successfully.',
                'data' => [
                    'id' => $updatedSession['id'],
                    'title' => $updatedSession['title'],
                    'updated_at' => $updatedSession['updated_at'],
                ],
            ]);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update chat title.',
                'errors' => config('app.debug') ? $error->getMessage() : null,
            ], 500);
        }
    }

    public function deleteChatSession(Request $request, int $session_id): JsonResponse
    {
        try {
            $deleted = $this->chatSessionService->deleteSession(
                $request->user()->user_id,
                $session_id
            );

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Chat session deleted successfully.',
                'data' => [
                    'id' => $session_id,
                    'deleted' => true,
                ],
            ]);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete chat session.',
                'errors' => config('app.debug') ? $error->getMessage() : null,
            ], 500);
        }
    }
}
