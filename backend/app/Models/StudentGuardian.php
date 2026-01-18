<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\GuardianAddress;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class StudentGuardian extends Model
{
    protected $table = 'student_guardians';
    protected $primaryKey = 'student_guardian_id';
    public $timestamps = false;

    protected $fillable = [
        'student_guardian_id',
        'id',
        'guardian_id',
        'enrollment_id'
    ];

    public function guardian() : BelongsTo
    {
        return $this->belongsTo(Guardian::class, 'guardian_id', 'guardian_id');
    }

    public function student() : BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }

    public function guardianAddress() : HasOneThrough
    {
        return $this->hasOneThrough(
            GuardianAddress::class, 
            Guardian::class,
            'guardian_id', 
            'guardian_id', 
            'guardian_id', 
            'guardian_id', 
        );
    }


}
