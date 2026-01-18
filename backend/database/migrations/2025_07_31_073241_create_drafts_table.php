<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('drafts', function (Blueprint $table) {
            $table->uuid('draft_id')->primary();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('school_year_id')->nullable();
            $table->unsignedBigInteger('semester_id')->nullable();
            $table->timestamp('registration_date_draft')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('set null');
            $table->foreign('school_year_id')->references('school_year_id')->on('school_years')->onDelete('set null');
            $table->foreign('semester_id')->references('semester_id')->on('semesters')->onDelete('set null');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('drafts');
    }
};
