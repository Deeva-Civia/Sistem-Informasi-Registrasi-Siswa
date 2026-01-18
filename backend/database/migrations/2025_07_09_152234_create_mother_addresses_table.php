<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('mother_addresses', function (Blueprint $table) {
            $table->id('mother_address_id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('street', 100)->nullable();
            $table->string('village', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('rt', 20)->nullable();
            $table->string('rw', 20)->nullable();
            $table->string('city_regency', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->text('other')->nullable();
            $table->foreign('parent_id')->references('parent_id')->on('parents')->onDelete('set null');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('mother_addresses');
    }
};
