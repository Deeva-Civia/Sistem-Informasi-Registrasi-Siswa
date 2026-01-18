<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('pickup_points', function (Blueprint $table) {
            $table->id('pickup_point_id');
            $table->string('name', 200)->nullable();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('pickup_points');
    }
};
