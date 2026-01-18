<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id('student_guardian_id');
            $table->unsignedBigInteger('id')->nullable();
            $table->unsignedBigInteger('guardian_id')->nullable();
            $table->foreign('id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('guardian_id')->references('guardian_id')->on('guardians')->onDelete('set null');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('student_guardians');
    }
};
