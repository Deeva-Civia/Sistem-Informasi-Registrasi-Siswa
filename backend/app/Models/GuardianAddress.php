<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\StudentGuardian;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class GuardianAddress extends Model
{
    protected $table = 'guardian_addresses';
    protected $primaryKey = 'guardian_address_id';
    public $timestamps = false;

    protected $fillable = [
        'guardian_address_id',
        'guardian_id',
        'street',
        'village',
        'district',
        'rt',
        'rw',
        'city_regency',
        'province',
        'other'
    ];

    public function studentGuardians() : HasManyThrough
    {
        return $this->hasManyThrough(
            StudentGuardian::class,
            Guardian::class,
            'guardian_id',
            'guardian_id',
            'guardian_address_id',
            'guardian_id'
        );
    }

    public function guardian() : BelongsTo
    {
        return $this->belongsTo(
            Guardian::class,
            'guardian_id',
            'guardian_id'
        );
    }

    public function getStudentsAttribute()
    {
        return Student::whereIn(
            'id',
            $this->studentGuardians->pluck('id')->unique()
        )->get();
    }

}
