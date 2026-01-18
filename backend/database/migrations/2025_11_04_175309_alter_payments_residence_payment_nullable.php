<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `payments`
            MODIFY `residence_payment`
            ENUM('Full Payment','Installment') NULL");
    }

    public function down(): void
    {
        DB::statement("UPDATE `payments`
            SET `residence_payment` = 'Full Payment'
            WHERE `residence_payment` IS NULL");

        DB::statement("ALTER TABLE `payments`
            MODIFY `residence_payment`
            ENUM('Full Payment','Installment') NOT NULL");
    }
};