<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cancelled_registrations', function (Blueprint $table) {
            $table->enum('reason', ['Cancellation of Enrollment', 'Invalid Section'])
                ->nullable()
                ->after('cancelled_by');
        });
    }

    public function down(): void
    {
        Schema::table('cancelled_registrations', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};

