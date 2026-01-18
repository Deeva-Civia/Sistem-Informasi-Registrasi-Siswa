<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    protected $fillable = ['last_used_at'];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];
}
