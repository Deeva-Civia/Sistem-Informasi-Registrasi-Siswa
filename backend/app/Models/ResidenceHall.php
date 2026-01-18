<?php

namespace App\Models;

use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ResidenceHall extends Model
{
    protected $table = 'residence_halls';
    protected $primaryKey = 'residence_id';
    public $timestamps = false;

    protected $fillable = [
        'residence_id',
        'type',
    ];

    public function enrollments() : HasMany
    {
        return $this->hasMany(Enrollment::class, 'residence_id', 'residence_id');
    }

    public function students() : HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class, 
            Enrollment::class,
            'residence_id',
            'id', 
            'residence_id',
            'id'
        );
    }
}
