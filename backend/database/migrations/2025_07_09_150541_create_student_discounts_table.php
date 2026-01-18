<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('student_discounts', function (Blueprint $table) {
            $table->id('student_discount_id');
            $table->unsignedBigInteger('enrollment_id')->nullable();
            $table->unsignedBigInteger('discount_type_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreign('enrollment_id')->references('enrollment_id')->on('enrollments')->onDelete('set null');
            $table->foreign('discount_type_id')->references('discount_type_id')->on('discount_types')->onDelete('set null');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('student_discounts');
    }
};
