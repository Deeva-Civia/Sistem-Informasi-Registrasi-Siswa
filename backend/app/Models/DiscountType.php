<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Enrollment;
use App\Models\StudentDiscount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class DiscountType extends Model
{
    protected $table = 'discount_types';
    protected $primaryKey = 'discount_type_id';
    public $timestamps = false;

    protected $fillable = [
        'discount_type_id',
        'name',
    ];

    public function studentDiscount() : HasMany
    {
        return $this->hasMany(
            StudentDiscount::class,
            'discount_type_id',
            'discount_type_id'
        );
    }

    public function enrollments() : HasManyThrough
    {
        return $this->hasManyThrough(
            Enrollment::class,
            StudentDiscount::class,
            'discount_type_id',
            'enrollment_id',
            'discount_type_id',
            'enrollment_id'
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
