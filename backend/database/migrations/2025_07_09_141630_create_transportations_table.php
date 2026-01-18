<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
    public function up(): void
    {
        Schema::create('transportations', function (Blueprint $table) {
            $table->id('transport_id');
            $table->enum('type', ['Own car', 'School bus'])->nullable();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('transportations');
    }
};
