<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->timestamp('updated_at')
                ->nullable()
                ->after('registration_date');

            $table->timestamp('graduated_at')
                ->nullable()
                ->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['updated_at', 'graduated_at']);
        });
    }
};
