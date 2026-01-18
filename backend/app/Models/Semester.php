<?php

namespace App\Models;

use App\Models\Draft;
use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Semester extends Model
{
    protected $table = 'semesters';
    protected $primaryKey = 'semester_id';
    public $timestamps = false;

    protected $fillable = [
        'semester_id',
        'name',
        'number'
    ];

    public function students() : HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            Enrollment::class,
            'semester_id',
            'id',
            'semester_id',
            'id',
        );
    }

    public function enrollments() : HasMany
    {
        return $this->hasMany(
            Enrollment::class,
            'semester_id',
            'semester_id',
        );
    }

    public function drafts() : HasMany
    {
        return $this->hasMany(
            Draft::class,
            'semester_id',
            'semester_id'
        );
    }
}
