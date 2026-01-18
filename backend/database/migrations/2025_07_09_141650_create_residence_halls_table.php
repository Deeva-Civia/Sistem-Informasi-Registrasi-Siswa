<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('residence_halls', function (Blueprint $table) {
            $table->id('residence_id');
            $table->enum('type', ['Boys dormitory', 'Girls dormitory', 'Non-Residence hall']);
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('residence_halls');
    }
};
