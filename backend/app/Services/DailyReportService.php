<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DailyReportService
{
    public function getTodayRecap($targetDate = null, $schoolYearId = null)
    {
        try {
            $targetDate = $targetDate ?? Carbon::today()->format('Y-m-d');
            
            // 1. Fetch Detailed List (HANYA UNTUK HARI INI)
            $sqlList = "
                SELECT 
                    e.registration_date,
                    s.student_id,
                    CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name,
                    c.grade,
                    rh.type as residence_type,
                    p.tuition_fees,
                    p.residence_payment,
                    p.financial_policy_contract,
                    dt.name as discount_type,
                    sd.notes as discount_notes,
                    e.student_status,
                    s.gender,
                    s.academic_status,
                    sy.year as school_year,
                    sec.name as section
                FROM enrollments e
                JOIN students s ON e.id = s.id
                LEFT JOIN sections sec ON e.section_id = sec.section_id
                LEFT JOIN classes c ON e.class_id = c.class_id
                LEFT JOIN residence_halls rh ON e.residence_id = rh.residence_id
                LEFT JOIN payments p ON e.enrollment_id = p.enrollment_id
                LEFT JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id
                LEFT JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id
                LEFT JOIN school_years sy ON e.school_year_id = sy.school_year_id
                WHERE DATE(e.registration_date) = ?
            ";

            $bindingsList = [$targetDate];

            if ($schoolYearId) {
                $sqlList .= " AND e.school_year_id = ?";
                $bindingsList[] = $schoolYearId;
            }

            $sqlList .= " ORDER BY e.registration_date ASC";

            $results = DB::connection('mysql_readonly')->select($sqlList, $bindingsList);

            // Dapatkan seluruh Grade unik yang ada untuk dijadikan Kategori secara dinamis
            $gradesFound = [];
            $schoolYearsFound = [];
            foreach ($results as $r) {
                if (!empty($r->grade) && !in_array($r->grade, $gradesFound)) {
                    $gradesFound[] = $r->grade;
                }
                if (!empty($r->school_year) && !in_array($r->school_year, $schoolYearsFound)) {
                    $schoolYearsFound[] = $r->school_year;
                }
            }
            sort($gradesFound);
            sort($schoolYearsFound);

            $summaryMap = [];
            $addCat = function($cat, $crit) use (&$summaryMap) {
                $summaryMap[$cat.'|'.$crit] = [
                    'Kategori' => $cat,
                    'Kriteria' => $crit,
                    'Total' => 0
                ];
            };

            // Urutan Kategori Baku sesuai permintaan
            $addCat('Student Status', 'New');
            $addCat('Student Status', 'Old');
            $addCat('Student Status', 'Transferee');
            $addCat('Gender', 'M');
            $addCat('Gender', 'F');
            foreach ($gradesFound as $g) {
                $addCat('Grade', $g);
            }
            $addCat('SG', 'Old'); $addCat('SG', 'New');
            $addCat('SD', 'Old'); $addCat('SD', 'New');
            $addCat('SC', 'Old'); $addCat('SC', 'New');
            $addCat('Cash 12%', 'Old'); $addCat('Cash 12%', 'New');
            $addCat('Cash 10%', 'Old'); $addCat('Cash 10%', 'New');
            $addCat('Cash 5%', 'Old'); $addCat('Cash 5%', 'New');
            $addCat('IP%', 'Old'); $addCat('IP%', 'New');
            $addCat('Academic Status', 'Regular'); $addCat('Academic Status', 'Sit In');
            $addCat('Payment', 'Cash'); $addCat('Payment', 'IP');

            foreach ($schoolYearsFound as $sy) {
                $addCat('School Year', $sy);
            }

            $detailedList = [];

            foreach ($results as $row) {
                $status = strtolower($row->student_status ?? '');
                $isNew = ($status === 'new');
                $isOld = ($status === 'old');
                $isTransferee = ($status === 'transferee');
                $discStatus = $isNew ? 'New' : 'Old';
                
                $genderRaw = strtolower($row->gender ?? '');
                $isM = ($genderRaw === 'male' || $genderRaw === 'm');
                $isF = ($genderRaw === 'female' || $genderRaw === 'f');
                $gender = $isM ? 'MALE' : 'FEMALE';
                
                // Cek Payment
                $fpc = strtolower($row->financial_policy_contract ?? '');
                $isFullPayment = false;
                $isInstallment = false;
                
                if ($fpc === 'cash') {
                    $isFullPayment = true;
                } elseif ($fpc === 'ip') {
                    $isInstallment = true;
                } else {
                    if (stripos($row->tuition_fees ?? '', 'installment') !== false || stripos($row->residence_payment ?? '', 'installment') !== false) {
                        $isInstallment = true;
                    } else {
                        $isFullPayment = true;
                    }
                }
                $paymentMethod = $isFullPayment ? 'Full Payment' : 'Installment';
                
                // Cek Discount
                $dt = strtolower($row->discount_type ?? '');
                $dn = strtolower($row->discount_notes ?? '');

                // Tallying (Penghitungan Total pada Kategori)
                if ($isNew) $summaryMap['Student Status|New']['Total']++;
                if ($isOld) $summaryMap['Student Status|Old']['Total']++;
                if ($isTransferee) $summaryMap['Student Status|Transferee']['Total']++;
                
                if ($isM) $summaryMap['Gender|M']['Total']++;
                if ($isF) $summaryMap['Gender|F']['Total']++;
                
                if (!empty($row->grade)) $summaryMap['Grade|'.$row->grade]['Total']++;
                if (!empty($row->school_year)) $summaryMap['School Year|'.$row->school_year]['Total']++;

                if (stripos($dt, 'beasiswa') !== false || $dt === 'sg') $summaryMap['SG|'.$discStatus]['Total']++;
                if (stripos($dt, 'special discount') !== false || $dt === 'sd') $summaryMap['SD|'.$discStatus]['Total']++;
                if (stripos($dt, 'staff') !== false || $dt === 'sc') $summaryMap['SC|'.$discStatus]['Total']++;

                if ($isFullPayment) {
                    if (strpos($dn, '12%') !== false) $summaryMap['Cash 12%|'.$discStatus]['Total']++;
                    if (strpos($dn, '10%') !== false) $summaryMap['Cash 10%|'.$discStatus]['Total']++;
                    if (strpos($dn, '5%') !== false) $summaryMap['Cash 5%|'.$discStatus]['Total']++;
                }

                if ($dt === 'ip') {
                    if ($isInstallment) {
                        $summaryMap['IP%|'.$discStatus]['Total']++;
                    } elseif ($isFullPayment) {
                        $summaryMap['Payment|IP']['Total']++;
                    }
                }

                if ($isFullPayment) $summaryMap['Payment|Cash']['Total']++;

                $academicStatus = strtolower($row->academic_status ?? '');
                if ($academicStatus === 'regular') $summaryMap['Academic Status|Regular']['Total']++;
                if ($academicStatus === 'sit-in' || $academicStatus === 'sit in') $summaryMap['Academic Status|Sit In']['Total']++;

                // Build Detail Object
                $detailedList[] = [
                    'student_id' => $row->student_id,
                    'full_name' => trim($row->full_name),
                    'section' => $row->section,
                    'grade' => $row->grade,
                    'residence_type' => $row->residence_type,
                    'payment_method' => $paymentMethod,
                    'discount_type' => $row->discount_type ?? 'No Discount',
                    'discount_notes' => $row->discount_notes,
                    'student_status' => ucfirst($status),
                    'gender' => $gender,
                    'academic_status' => strtoupper($academicStatus),
                    'school_year' => $row->school_year,
                    'total_registration' => 1,
                    'registration_date' => explode(' ', $row->registration_date)[0]
                ];
            }

            $summaryList = array_values($summaryMap);
            $totalOverall = count($results);

            // 2. Fetch Comparative Data (Tahun Sebelumnya, Saat ini, dan Selanjutnya)
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $startYear = ($currentMonth >= 7) ? $currentYear : ($currentYear - 1);
            
            $prevSchoolYearStr = ($startYear - 1) . '/' . $startYear;
            $currentSchoolYearStr = $startYear . '/' . ($startYear + 1);
            $nextSchoolYearStr = ($startYear + 1) . '/' . ($startYear + 2);

            $compSql = "
                SELECT 
                    sy.year as school_year,
                    SUM(CASE WHEN LOWER(e.student_status) = 'new' THEN 1 ELSE 0 END) as total_new,
                    SUM(CASE WHEN LOWER(e.student_status) = 'old' THEN 1 ELSE 0 END) as total_returning
                FROM enrollments e
                JOIN school_years sy ON e.school_year_id = sy.school_year_id
                WHERE DATE(e.registration_date) <= ? AND sy.year IN (?, ?, ?)
                GROUP BY sy.year
            ";
            
            $compResults = DB::connection('mysql_readonly')->select($compSql, [$targetDate, $prevSchoolYearStr, $currentSchoolYearStr, $nextSchoolYearStr]);
            
            // Siapkan template default (Supaya tetap muncul walaupun nilai datanya 0)
            $comparativeMap = [
                $prevSchoolYearStr => ['School Year' => $prevSchoolYearStr, 'Total New' => 0, 'Total Returning' => 0, 'Total Enrollee' => 0],
                $currentSchoolYearStr => ['School Year' => $currentSchoolYearStr, 'Total New' => 0, 'Total Returning' => 0, 'Total Enrollee' => 0],
                $nextSchoolYearStr => ['School Year' => $nextSchoolYearStr, 'Total New' => 0, 'Total Returning' => 0, 'Total Enrollee' => 0],
            ];

            // Isi nilai jika ditemukan dari database
            foreach ($compResults as $row) {
                if (isset($comparativeMap[$row->school_year])) {
                    $comparativeMap[$row->school_year]['Total New'] = (int) $row->total_new;
                    $comparativeMap[$row->school_year]['Total Returning'] = (int) $row->total_returning;
                    $comparativeMap[$row->school_year]['Total Enrollee'] = (int) ($row->total_new + $row->total_returning);
                }
            }

            $comparativeData = array_values($comparativeMap);
            
            return [
                'summary' => $summaryList,
                'details' => $detailedList,
                'comparative' => $comparativeData,
                'total' => $totalOverall
            ];

        } catch (\Exception $e) {
            Log::error('DailyReportService Error: ' . $e->getMessage());
            throw new \Exception("Gagal mengambil data laporan harian.");
        }
    }
}