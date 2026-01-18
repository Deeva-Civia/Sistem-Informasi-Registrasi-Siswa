<?php

namespace App\Models;

use App\Models\Student;
use App\Models\Enrollment;
use App\Models\PickupPoint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transportation extends Model
{
    protected $table = 'transportations';
    protected $primaryKey = 'transport_id';
    public $timestamps = false;

    protected $fillable = [
        'transport_id',
        'type'
    ];

    public function students() : HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            Enrollment::class,
            'transport_id',
            'id',
            'transport_id',
            'id'
        );
    }

    public function enrollments() : HasMany
    {
        return $this->hasMany(
            Enrollment::class,
            'transport_id',
            'transport_id',
        );
    }
}