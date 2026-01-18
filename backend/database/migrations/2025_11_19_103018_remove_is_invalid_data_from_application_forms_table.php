<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn('is_invalid_data');
        });
    }

    public function down(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->boolean('is_invalid_data')->default(false)->after('status');
        });
    }
};