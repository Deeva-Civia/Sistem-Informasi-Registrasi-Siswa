<?php

namespace App\Models;

use App\Models\Enrollment;
use App\Models\DiscountType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDiscount extends Model
{
    protected $table = 'student_discounts';
    protected $primaryKey = 'student_discount_id';
    public $timestamps = false;

    protected $fillable = [
        'student_discount_id',
        'enrollment_id',
        'discount_type_id',
        'notes',
    ];

    public function discountType() : BelongsTo
    {
        return $this->belongsTo(
            DiscountType::class, 
            'discount_type_id', 
            'discount_type_id');
    }
    
    public function enrollment() : BelongsTo
    {
        return $this->belongsTo(
            Enrollment::class, 
            'enrollment_id', 
            'enrollment_id');
    }

    public function getStudentAttribute() 
    {
        return $this->enrollment ? $this->enrollment->student : null;
    }
}
