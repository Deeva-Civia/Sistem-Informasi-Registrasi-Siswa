<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_old_table', function (Blueprint $table) {
            $table->id('id');
            $table->integer('studentold_id');
            $table->string('nisn', 15)->nullable();
            $table->string('first_name', 50)->nullable();
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50)->nullable();
            $table->string('nickname', 50)->nullable();
            $table->string('place_of_birth', 255)->nullable();
            $table->date('date_of_birth', 20)->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('student_address', 255)->nullable();
            $table->string('student_phone', 20)->nullable();
            $table->string('student_email', 255)->nullable();
            $table->string('previous_school', 255)->nullable();
            $table->string('religion', 30)->nullable();
            $table->unsignedBigInteger('nik')->nullable();
            $table->string('section', 25)->nullable();
            $table->unsignedTinyInteger('section_id')->nullable();
            $table->string('class', 10)->nullable();
            $table->unsignedTinyInteger('class_id')->nullable();
            $table->string('father_name', 100)->nullable();
            $table->string('father_occupation', 255)->nullable();
            $table->string('father_company', 255)->nullable();
            $table->string('father_address', 300)->nullable();
            $table->string('father_phone', 20)->nullable();
            $table->string('father_email', 255)->nullable();
            $table->string('mother_name', 100)->nullable();
            $table->string('mother_occupation', 255)->nullable();
            $table->string('mother_company', 255)->nullable();
            $table->string('mother_address', 300)->nullable();
            $table->string('mother_phone', 20)->nullable();
            $table->string('mother_email', 255)->nullable();
            $table->string('guardian_name', 100)->nullable();
            $table->string('relation_to_student', 100)->nullable();
            $table->string('guardian_address', 255)->nullable();
            $table->string('guardian_phone', 20)->nullable();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('student_old_table');
    }
};