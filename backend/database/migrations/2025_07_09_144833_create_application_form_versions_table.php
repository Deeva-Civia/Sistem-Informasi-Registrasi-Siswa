<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('application_form_versions', function (Blueprint $table) {
            $table->id('version_id');
            $table->unsignedBigInteger('application_id')->nullable();
            $table->integer('version')->default(1); 
            $table->dateTime('updated_at')->nullable();
            $table->string('updated_by', 100)->nullable();
            $table->string('action', 100)->nullable();
            $table->json('data_snapshot')->nullable();
            $table->foreign('application_id')->references('application_id')->on('application_forms')->onDelete('set null');
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('application_form_versions');
    }
};
