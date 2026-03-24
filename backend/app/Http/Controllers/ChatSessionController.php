<?php

namespace App\Http\Controllers;

use Throwable;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatSessionController extends Controller
{
    public function createChatSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:1000',
            'input_type' => 'nullable|string|in:standard,dynamic',
        ]);

        try {
            $text = trim($validated['text']);
            $inputType = $validated['input_type'] ?? 'dynamic';
            $title = $this->generateTitle($text, $inputType);

            $session = ChatSession::query()->create([
                'user_id' => $request->user()->user_id,
                'title' => $title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chat session created successfully.',
                'data' => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'created_at' => optional($session->created_at)->toISOString(),
                    'updated_at' => optional($session->updated_at)->toISOString(),
                ],
            ], 201);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create chat session.',
                'errors' => config('app.debug') ? $error->getMessage() : null,
            ], 500);
        }
    }

    public function fetchChatDetails(Request $request, int $session_id): JsonResponse
    {
        try {
            $session = $this->findOwnedSession($request, $session_id);
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            $chatMessages = ChatMessage::query()
                ->where('chat_session_id', $session->id)
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            $parsedMessages = $this->parseJSONContent($chatMessages);
            $formattedHistory = $this->formatHistoryResponse($parsedMessages);

            return response()->json([
                'success' => true,
                'message' => 'Chat history fetched successfully.',
                'data' => $formattedHistory,
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
            $query = ChatSession::query()
                ->where('user_id', $request->user()->user_id);

            if ($keyword !== '') {
                $query->where('title', 'like', '%' . $keyword . '%');
            }

            $sessions = $query->orderByDesc('updated_at')->get();
            $formattedSessionList = $this->formatSessionList($sessions);

            return response()->json([
                'success' => true,
                'message' => $sessions->isEmpty()
                    ? 'No chat sessions found.'
                    : 'Chat sessions fetched successfully.',
                'data' => $formattedSessionList,
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
            $session = $this->findOwnedSession($request, $session_id);
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            $session->title = trim($validated['new_title']);
            $session->save();

            return response()->json([
                'success' => true,
                'message' => 'Chat title updated successfully.',
                'data' => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'updated_at' => optional($session->updated_at)->toISOString(),
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
            $session = $this->findOwnedSession($request, $session_id);
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat session not found.',
                    'errors' => null,
                ], 404);
            }

            $session->delete();

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

    private function findOwnedSession(Request $request, int $sessionId): ?ChatSession
    {
        return ChatSession::query()
            ->where('id', $sessionId)
            ->where('user_id', $request->user()->user_id)
            ->first();
    }

    private function parseJSONContent($chatMessages)
    {
        return $chatMessages->map(function (ChatMessage $message) {
            $messageContent = $message->message_content;
            if (is_string($messageContent)) {
                $decoded = json_decode($messageContent, true);
                $messageContent = json_last_error() === JSON_ERROR_NONE
                    ? $decoded
                    : $messageContent;
            }

            return [
                'id' => $message->id,
                'chat_session_id' => $message->chat_session_id,
                'sender_type' => $message->sender_type,
                'message_content' => $messageContent,
                'generated_sql' => $message->genereted_sql,
                'created_at' => optional($message->created_at)->toISOString(),
            ];
        })->values();
    }

    private function formatHistoryResponse($parsedMessages): array
    {
        return $parsedMessages->toArray();
    }

    private function formatSessionList($sessions): array
    {
        return $sessions->map(function (ChatSession $session) {
            return [
                'id' => $session->id,
                'title' => $session->title,
                'updated_at' => optional($session->updated_at)->toISOString(),
                'created_at' => optional($session->created_at)->toISOString(),
            ];
        })->values()->toArray();
    }

    private function generateTitle(string $text, string $inputType): string
    {
        $normalizedText = preg_replace('/\s+/', ' ', trim($text));

        if ($normalizedText === '') {
            return 'New Chat';
        }

        if ($inputType === 'standard') {
            return 'Rekapan Pendaftaran';
        }

        if (mb_strlen($normalizedText) <= 42) {
            return $normalizedText;
        }

        return rtrim(mb_substr($normalizedText, 0, 42)) . '...';
    }
}
