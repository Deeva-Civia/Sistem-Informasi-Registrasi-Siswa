<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chat_session_id');
            $table->enum('sender_type', ['user', 'AI', 'Backend', 'system']);
            $table->json('message_content');
            $table->text('generated_sql')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('chat_session_id')
                ->references('id')
                ->on('chat_session')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
