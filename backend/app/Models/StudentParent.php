<?php

namespace App\Models;

use App\Models\Student;
use App\Models\FatherAddress;
use App\Models\MotherAddress;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentParent extends Model
{
    protected $table = 'parents';
    protected $primaryKey = 'parent_id';
    public $timestamps = false;

    protected $fillable = [
        'parent_id',
        'id',
        'father_name',
        'father_occupation',
        'father_company',
        'father_phone',
        'father_email',
        'mother_name',
        'mother_occupation',
        'mother_company',
        'mother_phone',
        'mother_email',
        'enrollment_id'

    ];

    public function student() : BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'id');
    }

    public function fatherAddress() : HasOne
    {
        return $this->hasOne(FatherAddress::class, 'parent_id', 'parent_id');
    }

    public function motherAddress() : HasOne
    {
        return $this->hasOne(MotherAddress::class, 'parent_id', 'parent_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }
}
