<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\AuditLog;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use App\Models\ApplicationForm;
use App\Services\AnalyticsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\CancelledRegistration;
use Illuminate\Support\Facades\Cache;
use App\Services\DashboardCacheService; 

class DashboardController extends Controller
{
    protected $analyticsService;
    protected $cacheService;

    public function __construct(AnalyticsService $analyticsService, DashboardCacheService $cacheService)
    {
        $this->analyticsService = $analyticsService;
        $this->cacheService = $cacheService;
    }

    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $username = $user->username;

            $now = Carbon::now();
            $dateKey = $now->format('Y-m-d');

            $currentYearInt = $now->year;
            $startYear = $now->month >= 7 ? $currentYearInt : $currentYearInt - 1;

            $currentSyName = $startYear . '/' . ($startYear + 1);
            $prevSyName = ($startYear - 1) . '/' . $startYear;
            $nextSyName = ($startYear + 1) . '/' . ($startYear + 2);

            $syMap = SchoolYear::whereIn('year', [$currentSyName, $prevSyName, $nextSyName])->pluck('school_year_id', 'year');
            $currSyId = $syMap[$currentSyName] ?? null;
            $prevSyId = $syMap[$prevSyName] ?? null;
            $nextSyId = $syMap[$nextSyName] ?? null;
            
            $lastCachedSchoolYear = Cache::get('last_cached_school_year');
            if ($lastCachedSchoolYear) {
                if ($lastCachedSchoolYear !== $currentSyName) {
                    $this->cacheService->invalidateStatsCacheByYear($lastCachedSchoolYear);

                    Cache::forget('dashboard_meta_' . $user->user_id . '_' . $lastCachedSchoolYear);
                    Cache::put('last_cached_school_year', $currentSyName);
                    \Log::info('Dashboard meta cache invalidated due to new school year: ' . $currentSyName);
                }
            } else {
                Cache::put('last_cached_school_year', $currentSyName);
            }

            // CACHE 1: Meta Data
            $metaCacheKey = 'dashboard_meta_' . $user->user_id . '_' . $currentSyName;

            $meta = Cache::remember($metaCacheKey, now()->addHours(24), function () use ($user, $currentSyName, $prevSyName, $nextSyName, $syMap) {
                $lastLogin = AuditLog::where('action', 'login_success')
                    ->where('user_id', $user->user_id)
                    ->orderByDesc('created_at')
                    ->skip(1)
                    ->first();

                return [
                    'last_login' => $lastLogin ? $lastLogin->created_at->toDateTimeString() : null,
                    'current_school_year_name' => $currentSyName, 
                    'previous_school_year_name' => $prevSyName, 
                    'next_school_year_name' => $nextSyName,
                    'current_school_year_id' => $syMap[$currentSyName] ?? null, 
                    'previous_school_year_id' => $syMap[$prevSyName] ?? null,
                    'next_school_year_id' => $syMap[$nextSyName] ?? null, 
                ];
            });
            $this->cacheService->addCacheKey($metaCacheKey);

            // CACHE 2: Statistik Data 
            $statCacheKey = 'dashboard_stats_' . $currentSyName . '_' . now()->format('Ymd');

            $stats = Cache::remember($statCacheKey, now()->addHours(24), function () use ($now, $dateKey, $currSyId, $prevSyId, $nextSyId, $startYear) {

                // 1. DAILY REGISTRATION
                $todayStats = $this->analyticsService->getDailyReport($dateKey, false);

                // 2. YEARLY REGISTRATION
                $currSyStats = $this->analyticsService->getYearlyReport($currSyId, $prevSyId, false);

                // 3. PRE-REGISTER REGISTRATION
                $preRegStats = $this->analyticsService->getPreRegReport($nextSyId, $currSyId, false);

                // 4. ACTIVE STUDENTS
                $activeStudents = $this->analyticsService->getActiveStudentsBySection($currSyId, false);

                // 5. TRENDS 
                $dailyTrend = $this->analyticsService->getDailyTrend($dateKey);

                return [
                    'today' => $todayStats,
                    'school_year' => $currSyStats,
                    'pre_register' => $preRegStats,
                    'active_students_matrix' => $activeStudents,
                    'daily_trend' => $dailyTrend,
                ];
            });
            $this->cacheService->addCacheKey($statCacheKey);

            // Real-time Data
            $latestRegistrations = ApplicationForm::with([
                'enrollment.student', 
                'enrollment.schoolClass', 
                'enrollment.section', 
                'enrollment.schoolYear'
            ])
                ->orderByDesc('created_at')
                ->take(3)
                ->get()
                ->map(function ($form) {
                    $enrollment = $form->enrollment;
                    $student = $form->enrollment->student;
                    $class = $form->enrollment->schoolClass;
                    $section = $form->enrollment->section;
                    $schoolYear = $form->enrollment->schoolYear;

                    return [
                        'application_id' => $form->application_id ?? null,
                        'student_id' => $student->student_id ?? null,
                        'full_name' => trim(
                            collect([$student->first_name, $student->middle_name, $student->last_name])
                                ->filter()
                                ->join(' ')
                        ),
                        'type' => $enrollment->student_status ?? null,
                        'grade' => $class->grade ?? null,
                        'section' => $section->name ?? null,
                        'school_year' => $schoolYear->year ?? null,
                        'status' => $form->status ?? null,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Dashboard data loaded successfully.',
                'data' => [
                    'username' => $username,
                    ...$meta,
                    ...$stats,
                    'latest_registrations' => $latestRegistrations,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('DashboardController Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard data',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}