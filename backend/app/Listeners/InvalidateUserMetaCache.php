<?php

namespace App\Listeners;

use App\Events\UserLoggedIn;
use Illuminate\Support\Facades\Cache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class InvalidateUserMetaCache
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(UserLoggedIn $event): void
    {
        $user = $event->user;
        $currentMonth = now()->month;
        $currentYear = now()->year;
        $schoolYearStr = ($currentMonth >= 7)
            ? $currentYear . '/' . ($currentYear + 1)
            : ($currentYear - 1) . '/' . $currentYear;
        
        $metaCacheKey = 'dashboard_meta_' . $user->user_id . '_' . $schoolYearStr;

        Cache::forget($metaCacheKey);

        \Log::info("Dashboard meta cache invalidated for user {$user->username} due to new login");
    }
}
