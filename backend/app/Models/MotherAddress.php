<?php

namespace App\Models;

use App\Models\Student;
use App\Models\StudentParent;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class MotherAddress extends Model
{
    protected $table = 'mother_addresses';
    protected $primaryKey = 'mother_address_id';
    public $timestamps = false;

    protected $fillable = [
        'mother_address_id',
        'parent_id',
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

    public function parent() : BelongsTo
    {
        return $this->belongsTo(StudentParent::class, 'parent_id', 'parent_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }
    
    public function student() : HasOneThrough
    {
        return $this->hasOneThrough(
            Student::class, 
            StudentParent::class, 
            'parent_id', 
            'id', 
            'parent_id', 
            'id'
        );
    }
}
