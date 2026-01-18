<?php

namespace App\Models;

use App\Models\Draft;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens;
    
    protected $primaryKey = 'user_id';
    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'user_id',
        'username',
        'full_name',
        'email',
        'password',
        'role'
    ];

    protected $hidden = [
        'password',
    ];

    public function drafts() : HasMany
    {
        return $this->hasMany(
            Draft::class,
            'user_id',
            'user_id'
        );
    }
}
