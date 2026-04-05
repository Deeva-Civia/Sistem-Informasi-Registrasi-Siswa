<?php

namespace App\Services;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Support\Str;

class ChatSessionService
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function handleSession(?string $sessionId, string $prompt, $userId = null)
    {
        if (!$sessionId) {
            $title = $this->geminiService->generateTitle($prompt);
            
            $session = ChatSession::create([
                'session_id' => Str::uuid()->toString(), 
                'user_id' => $userId,
                'title' => $title,
            ]);
            
            return [
                'session_id' => $session->id,
                'title' => $title,
            ];
        }

        // Jika session sudah ada, kembalikan session_id lama
        return [
            'session_id' => $sessionId,
            'title' => null 
        ];
    }

    public function saveMessage(string $sessionId, string $senderType, string $messageContent, ?string $generatedSql = null)
    {
        return ChatMessage::create([
            'chat_session_id' => $sessionId,
            'sender_type' => $senderType, 
            'message_content' => $messageContent,
            'generated_sql' => $generatedSql, 
        ]);
    }

    public function fetchSessionMessages(int $userId, int $sessionId): ?array
    {
        $session = $this->findOwnedSession($userId, $sessionId);
        if (!$session) {
            return null;
        }

        $chatMessages = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        return $this->parseMessages($chatMessages);
    }

    public function searchSessions(int $userId, string $keyword = ''): array
    {
        $normalizedKeyword = trim($keyword);

        $query = ChatSession::query()
            ->where('user_id', $userId);

        if ($normalizedKeyword !== '') {
            $query->where('title', 'like', '%' . $normalizedKeyword . '%');
        }

        $sessions = $query->orderByDesc('updated_at')->get();

        return $sessions->map(fn (ChatSession $session) => $this->formatSession($session))
            ->values()
            ->toArray();
    }

    public function renameSession(int $userId, int $sessionId, string $newTitle): ?array
    {
        $session = $this->findOwnedSession($userId, $sessionId);
        if (!$session) {
            return null;
        }

        $session->title = trim($newTitle);
        $session->save();

        return [
            'id' => $session->id,
            'title' => $session->title,
            'updated_at' => optional($session->updated_at)->toISOString(),
        ];
    }

    public function deleteSession(int $userId, int $sessionId): bool
    {
        $session = $this->findOwnedSession($userId, $sessionId);
        if (!$session) {
            return false;
        }

        $session->delete();
        return true;
    }

    public function findOwnedSession(int $userId, int $sessionId): ?ChatSession
    {
        return ChatSession::query()
            ->where('id', $sessionId)
            ->where('user_id', $userId)
            ->first();
    }

    private function parseMessages($chatMessages): array
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
                'generated_sql' => $message->generated_sql,
                'created_at' => optional($message->created_at)->toISOString(),
            ];
        })->values()->toArray();
    }

    private function formatSession(ChatSession $session): array
    {
        return [
            'id' => $session->id,
            'title' => $session->title,
            'updated_at' => optional($session->updated_at)->toISOString(),
            'created_at' => optional($session->created_at)->toISOString(),
        ];
    }
}
