<?php

namespace App\Providers;

use App\Events\UserLoggedIn;
use App\Events\StudentStatusUpdated;
use App\Events\ApplicationFormCreated;
use App\Listeners\InvalidateUserMetaCache;
use App\Listeners\InvalidateDashboardCache;
use App\Events\ApplicationFormStatusUpdated;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserLoggedIn::class => [
            InvalidateUserMetaCache::class,
        ],
        ApplicationFormCreated::class => [
            InvalidateDashboardCache::class,
        ],
        ApplicationFormStatusUpdated::class => [
            InvalidateDashboardCache::class,
        ],
        StudentStatusUpdated::class => [
            InvalidateDashboardCache::class,
        ],
    ];

    public function boot(): void
    {
    }
}
