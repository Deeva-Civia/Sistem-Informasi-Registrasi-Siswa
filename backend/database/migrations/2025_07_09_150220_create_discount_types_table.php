<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('discount_types', function (Blueprint $table) {
            $table->id('discount_type_id');
            $table->string('name', 100);
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('discount_types');
    }
};
