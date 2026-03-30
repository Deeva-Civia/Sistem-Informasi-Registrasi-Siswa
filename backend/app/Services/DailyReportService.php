<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DailyReportService
{
    public function getTodayRecap()
    {
        $sql = "
            SELECT 
                e.enrollment_id,
                e.registration_date,
                e.registration_id,
                CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name,
                e.student_status,
                s.gender,
                c.grade,
                s.academic_status,
                p.tuition_fees,
                p.residence_payment,
                GROUP_CONCAT(dt.name SEPARATOR ', ') as discount_types,
                GROUP_CONCAT(sd.notes SEPARATOR ', ') as discount_notes
            FROM enrollments e
            JOIN students s ON e.id = s.id
            JOIN classes c ON e.class_id = c.class_id
            LEFT JOIN payments p ON e.enrollment_id = p.enrollment_id
            LEFT JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id
            LEFT JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id
            WHERE DATE(e.registration_date) = CURDATE()
            GROUP BY 
                e.enrollment_id, e.registration_date, e.registration_id, 
                s.first_name, s.middle_name, s.last_name, e.student_status, 
                s.gender, c.grade, s.academic_status, p.tuition_fees, p.residence_payment
            ORDER BY e.registration_date ASC
        ";

        try {
            $results = DB::connection('mysql_readonly')->select($sql);
            
            return array_map(function ($value) {
                return (array) $value;
            }, $results);

        } catch (\Exception $e) {
            Log::error('DailyReportService Error: ' . $e->getMessage());
            throw new \Exception("Gagal mengambil data laporan harian.");
        }
    }
}v