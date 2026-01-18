<?php

namespace App\Models;

use App\Models\Student;
use App\Models\GuardianAddress;
use App\Models\StudentGuardian;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Guardian extends Model
{

    protected $table = 'guardians';
    protected $primaryKey = 'guardian_id';
    public $timestamps = false;

    protected $fillable = [
        'guardian_id',
        'guardian_name',
        'relation_to_student',
        'phone_number',
        'guardian_email'
    ];

    public function students() : BelongsToMany
    {
        return $this->belongsToMany(
            Student::class,
            'student_guardians',
            'guardian_id',
            'id',
            'guardian_id',
            'id'
        );
    }

    public function studentGuardians() : HasMany
    {
        return $this->hasMany(
            StudentGuardian::class,
            'guardian_id',
            'guardian_id'
        );
    }

    public function guardianAddress() : HasOne
    {
        return $this->hasOne(
            GuardianAddress::class,
            'guardian_id',
            'guardian_id'
        );
    }
}
