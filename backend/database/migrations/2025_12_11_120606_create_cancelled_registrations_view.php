<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Kita masukkan query SQL mentah Anda di sini
        DB::statement("
            CREATE OR REPLACE VIEW view_cancelled_registrations AS
            
            SELECT 
                student_status,
                full_name,
                sy.year as school_year,
                cr.school_year_id,
                sec.name as section,
                cr.section_id,
                registration_date,
                cancelled_at,
                notes
            FROM cancelled_registrations cr
            LEFT JOIN school_years sy ON cr.school_year_id = sy.school_year_id
            LEFT JOIN sections sec ON cr.section_id = sec.section_id
            WHERE cr.reason = 'Cancellation of Enrollment'
            AND cr.student_status IN ('New', 'Transferee')

            UNION ALL

            SELECT 
                student_status,
                CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name,
                sy.year as school_year,
                e.school_year_id,
                sec.name as section,
                e.section_id,
                e.registration_date,
                af.updated_at as cancelled_at,
                af.notes
            FROM application_forms af
            JOIN enrollments e ON af.enrollment_id = e.enrollment_id
            JOIN students s ON e.id = s.id
            LEFT JOIN school_years sy ON e.school_year_id = sy.school_year_id
            LEFT JOIN sections sec ON e.section_id = sec.section_id
            WHERE af.status = 'Cancelled'
            AND e.student_status = 'Old'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        DB::statement("DROP VIEW IF EXISTS view_cancelled_registrations");
    }
};
