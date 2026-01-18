<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id('section_id');
            $table->enum('name', ['ECP', 'Elementary School', 'Middle School', 'High School']);
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
