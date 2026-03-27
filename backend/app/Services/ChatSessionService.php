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
}