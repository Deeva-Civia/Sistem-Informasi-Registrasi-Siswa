<?php

namespace App\Listeners;

use App\Models\SchoolYear;
use Illuminate\Support\Facades\Cache;
use App\Events\ApplicationFormCreated;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Events\ApplicationFormStatusUpdated;
use App\Events\StudentStatusUpdated;
use App\Services\DashboardCacheService;

class InvalidateDashboardCache
{
    protected $cacheService;
    
    /**
     * Create the event listener.
     */
    public function __construct(DashboardCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Handle the event.
     */
    public function handle($event): void
    {
        \Log::info('InvalidateDashboardCache listener triggered', [
            'event' => get_class($event),
        ]);

        $reason = '';
        $schoolYearLog = 'All Years (Global Invalidation)';         

        if ($event instanceof ApplicationFormCreated) {
            $applicationForm = $event->applicationForm;
            $reason = 'new registration created';
            $schoolYearLog = $applicationForm->enrollment->schoolYear->year ?? 'unknown';
        } elseif ($event instanceof ApplicationFormStatusUpdated) {
            $applicationForm = $event->applicationForm;
            $reason = "status changed from {$event->oldStatus} to {$event->newStatus}";
            $schoolYearLog = $applicationForm->enrollment->schoolYear->year ?? 'unknown';
        } elseif ($event instanceof StudentStatusUpdated) {
            $student = $event->student; 
            $studentName = $event->student->first_name ?? 'Unknown';
            $reason = "student status/active updated for student: {$studentName}";
        }
        else {
            return;
        }

        $schoolYears = SchoolYear::pluck('year');
        
        foreach ($schoolYears as $year) {
            $this->cacheService->invalidateStatsCacheByYear($year);        
        }

        \Log::info("Dashboard cache invalidated due to {$reason} (school year: {$schoolYearLog})");
    }
}
