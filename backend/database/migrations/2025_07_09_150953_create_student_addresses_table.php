<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('student_addresses', function (Blueprint $table) {
            $table->id('student_address_id');
            $table->unsignedBigInteger('id')->nullable();
            $table->string('street', 100)->nullable();
            $table->string('village', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('rt', 20)->nullable();
            $table->string('rw', 20)->nullable();
            $table->string('city_regency', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->text('other')->nullable();
            $table->foreign('id')->references('id')->on('students')->onDelete('set null');

        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('student_addresses');
    }
};
