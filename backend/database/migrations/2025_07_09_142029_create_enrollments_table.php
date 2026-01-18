<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id('enrollment_id');
            $table->unsignedBigInteger('id')->nullable();
            $table->string('registration_id', 100)->unique();
            $table->timestamp('registration_date')->useCurrent();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable(); 
            $table->unsignedBigInteger('major_id')->nullable(); 
            $table->unsignedBigInteger('semester_id')->nullable();
            $table->unsignedBigInteger('school_year_id')->nullable();
            $table->unsignedBigInteger('program_id')->nullable();
            $table->unsignedBigInteger('residence_id')->nullable();
            $table->unsignedBigInteger('transport_id')->nullable();
            $table->unsignedBigInteger('pickup_point_id')->nullable();
            $table->enum('student_status', ['New','Old','Transferee']);
            $table->enum('residence_hall_policy', ['Signed', 'Not Signed']);
            $table->enum('transportation_policy', ['Signed', 'Not Signed'])->nullable();
            $table->enum('status', ['ACTIVE','INACTIVE']);
            $table->foreign('id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('class_id')->references('class_id')->on('classes')->onDelete('set null');
            $table->foreign('section_id')->references('section_id')->on('sections')->onDelete('set null'); 
            $table->foreign('major_id')->references('major_id')->on('majors')->onDelete('set null');   
            $table->foreign('semester_id')->references('semester_id')->on('semesters')->onDelete('set null');
            $table->foreign('school_year_id')->references('school_year_id')->on('school_years')->onDelete('set null');
            $table->foreign('program_id')->references('program_id')->on('programs')->onDelete('set null');
            $table->foreign('residence_id')->references('residence_id')->on('residence_halls')->onDelete('set null');
            $table->foreign('transport_id')->references('transport_id')->on('transportations')->onDelete('set null');
            $table->foreign('pickup_point_id')->references('pickup_point_id')->on('pickup_points')->onDelete('set null');
        });
    }
    

    
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
