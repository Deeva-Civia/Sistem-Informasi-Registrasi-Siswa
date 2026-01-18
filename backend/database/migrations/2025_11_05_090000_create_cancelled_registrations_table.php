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
        Schema::create('cancelled_registrations', function (Blueprint $table) {
            $table->id('cancelled_registration_id');
            $table->unsignedBigInteger('school_year_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();
            $table->string('student_id', 30);
            $table->string('full_name', 150);
            $table->string('registration_id', 100);
            $table->timestamp('registration_date')->nullable();
            $table->timestamp('cancelled_at')->useCurrent();
            $table->string('cancelled_by');
            $table->boolean('is_use_student_id')->default(false);
            $table->timestamps();
            $table->foreign('school_year_id')->references('school_year_id')->on('school_years')->onDelete('set null');
            $table->foreign('section_id')->references('section_id')->on('sections')->onDelete('set null');
            
            $table->index(['school_year_id', 'section_id']);
            $table->index('student_id');
            $table->index('registration_id');
            $table->index('cancelled_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cancelled_registrations');
    }
};
