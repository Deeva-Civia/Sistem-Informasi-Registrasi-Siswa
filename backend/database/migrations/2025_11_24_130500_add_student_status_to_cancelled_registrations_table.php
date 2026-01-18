<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cancelled_registrations', function (Blueprint $table) {
            $table->enum('student_status', ['New', 'Old', 'Transferee'])->after('is_use_student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cancelled_registrations', function (Blueprint $table) {
            $table->dropColumn('student_status');
        });
    }
};
