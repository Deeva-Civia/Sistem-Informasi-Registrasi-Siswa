<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parents', function (Blueprint $table) {
            $table->unsignedBigInteger('enrollment_id')->nullable()->after('id');
            $table->foreign('enrollment_id')
                  ->references('enrollment_id')
                  ->on('enrollments')
                  ->onDelete('cascade');
        });

        Schema::table('student_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('enrollment_id')->nullable()->after('id');
            $table->foreign('enrollment_id')
                  ->references('enrollment_id')
                  ->on('enrollments')
                  ->onDelete('cascade');
        }); 

        Schema::table('father_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('enrollment_id')->nullable()->after('parent_id');
            $table->foreign('enrollment_id')
                  ->references('enrollment_id')
                  ->on('enrollments')
                  ->onDelete('cascade');
        });

        Schema::table('mother_addresses', function (Blueprint $table) {
            $table->unsignedBigInteger('enrollment_id')->nullable()->after('parent_id');
            $table->foreign('enrollment_id')
                  ->references('enrollment_id')
                  ->on('enrollments')
                  ->onDelete('cascade');
        });

        Schema::table('student_guardians', function (Blueprint $table) {
            $table->unsignedBigInteger('enrollment_id')->nullable()->after('id');
            $table->foreign('enrollment_id')
                  ->references('enrollment_id')
                  ->on('enrollments')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('student_guardians', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });

        Schema::table('student_addresses', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });

         Schema::table('father_addresses', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });

        Schema::table('mother_addresses', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });

        Schema::table('parents', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropColumn('enrollment_id');
        });
    }
};