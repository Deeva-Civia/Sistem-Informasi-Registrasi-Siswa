<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class DashboardCacheService
{
    public function addCacheKey($key)
    {
        $keys = Cache::get('dashboard_keys', []);
        if (!in_array($key, $keys)) {
            $keys[] = $key;
            Cache::put('dashboard_keys', $keys, now()->addDays(30));
        }
    }

    public function invalidateStatsCacheByYear($yearStr)
    {
        $keys = Cache::get('dashboard_keys', []);
        $remaining = [];

        foreach ($keys as $key) {
            if (str_contains($key, $yearStr) && str_contains($key, 'dashboard_stats')) {
                Cache::forget($key);
            } else {
                $remaining[] = $key;
            }
        }

        Cache::put('dashboard_keys', $remaining, now()->addDays(30));
    }
}