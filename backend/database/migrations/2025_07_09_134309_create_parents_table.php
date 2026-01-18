<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('parents', function (Blueprint $table) {
            $table->id('parent_id');
            $table->unsignedBigInteger('id')->nullable(); 
            $table->string('father_name', 100)->nullable();
            $table->string('father_occupation', 100)->nullable();
            $table->string('father_company', 100)->nullable();
            $table->string('father_phone', 20)->nullable();
            $table->string('father_email', 100)->nullable();
            $table->string('mother_name', 100)->nullable();
            $table->string('mother_occupation', 100)->nullable();
            $table->string('mother_company', 100)->nullable();
            $table->string('mother_phone', 20)->nullable();
            $table->string('mother_email', 100)->nullable();
            $table->foreign('id')->references('id')->on('students')->onDelete('set null');
            
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('parents');
    }
};
