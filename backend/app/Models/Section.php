<?php

namespace App\Models;

use App\Models\CancelledRegistration;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Section extends Model
{
    protected $table = 'sections';
    protected $primaryKey = 'section_id';
    public $timestamps = false;

    protected $fillable = [
        'section_id',
        'name',
    ];

    public function schoolClasses() : HasMany
    {
        return $this->hasMany(SchoolClass::class, 'section_id', 'section_id');
    }

    public function enrollments() : HasMany
    {
        return $this->hasMany(Enrollment::class, 'section_id', 'section_id');
    }

    public function cancelledRegistrations() : HasMany
    {
        return $this->hasMany(
            CancelledRegistration::class,
            'section_id',
            'section_id'
        );
    }

    public function getStudentsAttribute() 
    {
        return Student::whereIn(
            'id',
            $this->enrollments->pluck('id')->unique()
        )->get();
    }
}
