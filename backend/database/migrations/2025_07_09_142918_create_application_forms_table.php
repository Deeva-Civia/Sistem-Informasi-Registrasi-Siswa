<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('application_forms', function (Blueprint $table) {
            $table->id('application_id');
            $table->unsignedBigInteger('enrollment_id')->nullable();
            $table->enum('status', ['Confirmed', 'Cancelled']);
            $table->boolean('is_invalid_data')->default(false);
            $table->dateTime('submitted_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('enrollment_id')->references('enrollment_id')->on('enrollments')->onDelete('set null');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('application_forms');
    }
};
