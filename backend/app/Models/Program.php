<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Program extends Model
{
    protected $table = 'programs';
    protected $primaryKey = 'program_id';
    public $timestamps = false;

    protected $fillable = [
        'program_id',
        'name',
        'other'
    ];

    public function enrollments() : HasMany
    {
        return $this->hasMany(
            Enrollment::class,
            'program_id',
            'program_id'
        );
    }

    public function students() : HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            Enrollment::class,
            'program_id',
            'id',
            'program_id',
            'id',
        );
    }
}
