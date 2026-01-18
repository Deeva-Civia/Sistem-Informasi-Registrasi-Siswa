<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SchoolYear;
use App\Models\ApplicationForm;
use App\Models\CancelledRegistration;
use App\Models\Enrollment; 
use Illuminate\Support\Facades\DB; 
use Carbon\Carbon;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_verify_dashboard_logic_against_real_database()
    {
        $simulationDate = '2026-11-20 10:00:00'; 
        Carbon::setTestNow($simulationDate);

        $user = User::first(); 
        if (!$user) {
            $this->markTestSkipped('Tidak ada user di database real.');
        }

        $response = $this->actingAs($user)->getJson('/api/dashboard');
        $response->assertStatus(200);
        $apiData = $response->json('data');

        $startOfDay = Carbon::today()->startOfDay();
        $endOfDay = Carbon::today()->endOfDay();
    
        // A. Total Registrations
        $dbTotalAppForms = ApplicationForm::count(); 
        $dbTotalCancelledNew = CancelledRegistration::where('reason', 'Cancellation of Enrollment')->count();
        $realTotalRegistrations = $dbTotalAppForms + $dbTotalCancelledNew;

        $this->assertEquals($realTotalRegistrations, $apiData['total_registrations'], 'Global: Total Registrations mismatch');

        // B. Total Cancelled (Returning + New)
        $dbCancelledReturning = ApplicationForm::where('status', 'Cancelled')->count();
        $realTotalCancelled = $dbCancelledReturning + $dbTotalCancelledNew;

        $this->assertEquals($realTotalCancelled, $apiData['total_cancelled'], 'Global: Total Cancelled mismatch');

        // A. Daily New Students (Total)
        // Logic: Confirmed New (di AppForm) + Cancelled New (di CancelledReg)
        $todayConfirmedNew = ApplicationForm::where('application_forms.status', 'Confirmed')
            ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
            ->where('enrollments.student_status', 'New')
            ->whereBetween('application_forms.created_at', [$startOfDay, $endOfDay])
            ->count();
            
        $todayCancelledNew = CancelledRegistration::where('reason', 'Cancellation of Enrollment')
            ->whereBetween('cancelled_at', [$startOfDay, $endOfDay])
            ->count();
            
        $realTodayNewTotal = $todayConfirmedNew + $todayCancelledNew;

        $this->assertEquals($realTodayNewTotal, $apiData['new_students_today_total'], 'Daily: New Students Total mismatch');
        $this->assertEquals($todayConfirmedNew, $apiData['new_students_today_confirmed'], 'Daily: New Students Confirmed mismatch');

        // B. Daily Returning Students (Total)
        // Logic: Confirmed Old (di AppForm) + Cancelled Old (di AppForm status Cancelled)
        $todayConfirmedReturning = ApplicationForm::where('application_forms.status', 'Confirmed')
            ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
            ->where('enrollments.student_status', 'Old')
            ->whereBetween('application_forms.created_at', [$startOfDay, $endOfDay])
            ->count();

        $todayCancelledReturning = ApplicationForm::where('status', 'Cancelled')
            ->whereBetween('updated_at', [$startOfDay, $endOfDay])
            ->count();

        $realTodayReturningTotal = $todayConfirmedReturning + $todayCancelledReturning;

        $this->assertEquals($realTodayReturningTotal, $apiData['returning_students_today_total'], 'Daily: Returning Students Total mismatch');

        $currentSyId = $apiData['current_school_year_id'];

        if ($currentSyId) {
            // A. SY Total Confirmed (New + Old)
            $realSyConfirmed = ApplicationForm::where('application_forms.status', 'Confirmed')
                ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
                ->where('enrollments.school_year_id', $currentSyId)
                ->count();

            $this->assertEquals($realSyConfirmed, $apiData['sy_total_confirmed'], 'Yearly: Total Confirmed mismatch');

            // B. SY New Students (Total: Confirmed + Cancelled)
            $syConfirmedNew = ApplicationForm::where('application_forms.status', 'Confirmed')
                ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
                ->where('enrollments.school_year_id', $currentSyId)
                ->where('enrollments.student_status', 'New')
                ->count();
            
            $syCancelledNew = CancelledRegistration::where('reason', 'Cancellation of Enrollment')
                ->where('school_year_id', $currentSyId)
                ->count();

            $realSyNewTotal = $syConfirmedNew + $syCancelledNew;
            
            $this->assertEquals($realSyNewTotal, $apiData['sy_new_students_total'], 'Yearly: New Students Total mismatch');

            // C. SY Returning Students (Total: Confirmed + Cancelled)
            $syConfirmedReturning = ApplicationForm::where('application_forms.status', 'Confirmed')
                ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
                ->where('enrollments.school_year_id', $currentSyId)
                ->where('enrollments.student_status', 'Old')
                ->count();

            $syCancelledReturning = ApplicationForm::where('application_forms.status', 'Cancelled')
                ->join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
                ->where('enrollments.school_year_id', $currentSyId)
                ->count();

            $realSyReturningTotal = $syConfirmedReturning + $syCancelledReturning;

            $this->assertEquals($realSyReturningTotal, $apiData['sy_returning_students_total'], 'Yearly: Returning Students Total mismatch');
        }

        
        if ($currentSyId) {
            $activeStudentsData = DB::table('students')
                ->select('sections.name as section_name', DB::raw('COUNT(DISTINCT students.id) as total_active'))
                ->join('enrollments', 'enrollments.id', '=', 'students.id')
                ->join('application_forms', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
                ->join('sections', 'enrollments.section_id', '=', 'sections.section_id')
                ->where('students.status', 'Not Graduate')
                ->where('students.active', 'YES')
                ->where('application_forms.status', 'Confirmed')
                ->where('enrollments.school_year_id', $currentSyId)
                ->groupBy('sections.name')
                ->get();

            $manualActiveCounts = ['ecp' => 0, 'elementary' => 0, 'middle' => 0, 'high' => 0];
            
            foreach ($activeStudentsData as $data) {
                $name = strtolower($data->section_name);
                if (str_contains($name, 'ecp')) $manualActiveCounts['ecp'] = $data->total_active;
                elseif (str_contains($name, 'elementary')) $manualActiveCounts['elementary'] = $data->total_active;
                elseif (str_contains($name, 'middle')) $manualActiveCounts['middle'] = $data->total_active;
                elseif (str_contains($name, 'high')) $manualActiveCounts['high'] = $data->total_active;
            }

            $this->assertEquals($manualActiveCounts, $apiData['active_students_by_section'], 'Active Students by Section mismatch');
        }
    }
}