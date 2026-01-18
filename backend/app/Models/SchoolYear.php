<?php

namespace App\Models;

use App\Models\CancelledRegistration;
use App\Models\Draft;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class SchoolYear extends Model
{

    protected $table = 'school_years';
    protected $primaryKey = 'school_year_id';
    public $timestamps = false;

    protected $fillable = [
        'school_year_id',
        'year',
    ];

    public function students() : HasManyThrough 
    {
        return $this->hasManyThrough(
            Student::class,
            Enrollment::class,
            'school_year_id',
            'id',
            'school_year_id',
            'id'
        );
    }
    public function enrollments() : HasMany
    {
        return $this->hasMany(Enrollment::class, 'school_year_id', 'school_year_id');
    }

    public function drafts() : HasMany
    {
        return $this->hasMany(
            Draft::class,
            'school_year_id',
            'school_year_id'
        );
    }

    public function cancelledRegistrations() : HasMany
    {
        return $this->hasMany(
            CancelledRegistration::class,
            'school_year_id',
            'school_year_id'
        );
    }
}
