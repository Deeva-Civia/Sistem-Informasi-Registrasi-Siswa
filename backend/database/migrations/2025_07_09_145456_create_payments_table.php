<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->unsignedBigInteger('id')->nullable();
            $table->enum('tuition_fees', ['Full Payment', 'Installment']);
            $table->enum('residence_payment', ['Full Payment', 'Installment']);
            $table->enum('financial_policy_contract', ['Signed', 'Not Signed']);
            $table->unsignedBigInteger('enrollment_id');
            $table->foreign('id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('enrollment_id')->references('enrollment_id')->on('enrollments')->onDelete('cascade');
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
