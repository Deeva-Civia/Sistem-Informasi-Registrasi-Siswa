<?php

namespace App\Models;

use App\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Enrollment;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'payment_id';
    public $timestamps = false;

    protected $fillable = [
        'payment_id',
        'id',
        'tuition_fees',
        'residence_payment',
        'financial_policy_contract',
        'enrollment_id',
    ];

    public function student() : BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'id');
    }

    public function enrollment() : BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }
}
