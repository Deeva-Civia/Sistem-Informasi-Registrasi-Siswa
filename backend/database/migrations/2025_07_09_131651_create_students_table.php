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
        Schema::create('students', function (Blueprint $table) {
            $table->id('id');
            $table->string('student_id', 30);
            $table->string('nisn')->nullable();
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50)->nullable();
            $table->string('nickname', 50)->nullable();
            $table->string('family_rank', 50);
            $table->enum('citizenship', ['Indonesia', 'Non Indonesia']);
            $table->string('country', 100)->nullable();
            $table->unsignedBigInteger('nik')->nullable(); 
            $table->string('kitas', 50)->nullable();
            $table->string('place_of_birth', 100);
            $table->date('date_of_birth');
            $table->string('age', 25);
            $table->enum('gender', ['MALE', 'FEMALE']);
            $table->string('phone_number', 20);
            $table->string('email', 100);
            $table->string('photo_path', 255)->nullable();
            $table->string('previous_school', 100)->nullable();
            $table->enum('religion', ['Islam','Kristen','Kristen Katolik','Hindu','Buddha','Konghucu','Kristen Advent',]);
            $table->enum('active', ['YES','NO']);
            $table->string('status', 50)->nullable();
            $table->string('academic_status_other', 50)->nullable();
            $table->enum('academic_status', ['REGULAR','SIT-IN','OTHER']);
            $table->timestamp('registration_date')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
