<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('va_mandiri', 50)->nullable()->after('religion');
            $table->string('va_bca', 50)->nullable()->after('va_mandiri');
            $table->string('va_bni', 50)->nullable()->after('va_bca');
            $table->string('va_bri', 50)->nullable()->after('va_bni');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'va_mandiri',
                'va_bca',
                'va_bni',
                'va_bri',
            ]);
        });
    }
};

