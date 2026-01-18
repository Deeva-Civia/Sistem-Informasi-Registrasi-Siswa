<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('registration_id');
            $table->index('section_id');
            $table->index('school_year_id');
            $table->index('semester_id');
        });
    }

    public function down(): void
    {   
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['registration_id']);
            $table->dropIndex(['section_id']);
            $table->dropIndex(['school_year_id']);
            $table->dropIndex(['semester_id']);
        });
    }
};