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
        DB::statement("DROP VIEW IF EXISTS view_registrations_mixed");
    
        DB::statement("
            CREATE VIEW view_registrations_mixed AS
            
            -- BAGIAN 1: Mengambil Data dari Enrollment (Mencakup CONFIRMED dan CANCELLED siswa lama)
            SELECT 
                e.enrollment_id as ref_id,
                s.student_id, 
                CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name) as full_name,
                sy.year as school_year, 
                sec.name as section, 
                c.grade,
                e.student_status as type,
                af.status as status,
                e.registration_date,
                'enrollment_table' as source_table
            FROM enrollments e
            JOIN students s ON e.id = s.id
            JOIN school_years sy ON e.school_year_id = sy.school_year_id
            JOIN sections sec ON e.section_id = sec.section_id
            JOIN classes c ON e.class_id = c.class_id
            LEFT JOIN application_forms af ON e.enrollment_id = af.enrollment_id

            UNION ALL

            -- BAGIAN 2: Mengambil Data dari Cancelled Registrations (Khusus New/Transferee yang dihapus)
            SELECT 
                cr.cancelled_registration_id as ref_id,
                cr.student_id, 
                cr.full_name,
                sy.year as school_year, 
                sec.name as section, 
                'N/A' as grade, -- Grade tidak tersedia di tabel cancelled, jadi N/A
                cr.student_status as type,
                'Cancelled' as status, -- Pasti Cancelled
                cr.registration_date,
                'cancelled_table' as source_table
            FROM cancelled_registrations cr
            JOIN school_years sy ON cr.school_year_id = sy.school_year_id
            JOIN sections sec ON cr.section_id = sec.section_id
            WHERE cr.reason = 'Cancellation of Enrollment'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS view_registrations_mixed");
    }
};
