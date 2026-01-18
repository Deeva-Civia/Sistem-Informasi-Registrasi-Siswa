<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE cancelled_registrations MODIFY COLUMN reason ENUM('Cancellation of Enrollment', 'Invalid Section', 'Invalid Data') NULL");

        DB::table('cancelled_registrations')
            ->where('reason', 'Invalid Section')
            ->update(['reason' => 'Invalid Data']);

        DB::statement("ALTER TABLE cancelled_registrations MODIFY COLUMN reason ENUM('Cancellation of Enrollment', 'Invalid Data') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE cancelled_registrations MODIFY COLUMN reason ENUM('Cancellation of Enrollment', 'Invalid Data', 'Invalid Section') NULL");

        DB::table('cancelled_registrations')
            ->where('reason', 'Invalid Data')
            ->update(['reason' => 'Invalid Section']);

        DB::statement("ALTER TABLE cancelled_registrations MODIFY COLUMN reason ENUM('Cancellation of Enrollment', 'Invalid Section') NULL");
    }
};