<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id('guardian_id');
            $table->string('guardian_name', 100)->nullable();
            $table->string('relation_to_student', 50)->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->string('guardian_email', 100)->nullable();
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};
