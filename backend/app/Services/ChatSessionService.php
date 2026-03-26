<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\ChatSession;

class ChatSessionService
{
    public function createSession(int $userId, string $text): array
    {
        $title = $this->generateTitle($text);

        $session = ChatSession::query()->create([
            'user_id' => $userId,
            'title' => $title,
        ]);

        return $this->formatSession($session);
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

    public function generateTitle(string $text): string
    {
        $normalizedText = preg_replace('/\s+/', ' ', trim($text));

        if ($normalizedText === '') {
            return 'New Chat';
        }

        if (mb_strlen($normalizedText) <= 42) {
            return $normalizedText;
        }

        return rtrim(mb_substr($normalizedText, 0, 42)) . '...';
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
                'generated_sql' => $message->genereted_sql,
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
