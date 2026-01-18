<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditTrailService
{

    public function log(string $action, array $extraData = [])
    {
        $user = Auth::user();

        AuditLog::create([
            'user_id'    => $user?->user_id,
            'action'     => $action,
            'ip'         => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata'   => $extraData
        ]);
    }
}
