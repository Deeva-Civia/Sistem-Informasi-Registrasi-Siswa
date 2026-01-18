<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Transportation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class PickupPoint extends Model
{
    protected $table = 'pickup_points';
    protected $primaryKey = 'pickup_point_id';
    public $timestamps = false;

    protected $fillable = [
        'pickup_point_id',
        'name',
    ];

    public function transportations(): HasMany
    {
        return $this->hasMany(Transportation::class, 'pickup_point_id', 'pickup_point_id');
    }

    public function enrollments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Enrollment::class,
            Transportation::class,
            'pickup_point_id', 
            'transport_id',    
            'pickup_point_id', 
            'transport_id'     
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
