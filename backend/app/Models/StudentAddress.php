<?php

namespace App\Models;

use App\Models\Student;
use App\Models\enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAddress extends Model
{
    protected $table = 'student_addresses';
    protected $primaryKey = 'student_address_id';
    public $timestamps = false;

    protected $fillable = [
        'student_address_id',
        'id',
        'street',
        'village',
        'district',
        'rt',
        'rw',
        'city_regency',
        'province',
        'other',
        'enrollment_id'
    ];

    public function student() : BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }
}
