<?php

namespace App\Models;

use App\Models\Payment;
use App\Models\Program;
use App\Models\Section;
use App\Models\Guardian;
use App\Models\Semester;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\SchoolClass;
use App\Models\DiscountType;
use App\Models\FatherAddress;
use App\Models\MotherAddress;
use App\Models\ResidenceHall;
use App\Models\StudentParent;
use App\Models\StudentAddress;
use App\Models\Transportation;
use App\Models\ApplicationForm;
use App\Models\GuardianAddress;
use App\Models\StudentDiscount;
use App\Models\StudentGuardian;
use App\Models\ApplicationFormVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Student extends Model
{
    protected $table = 'students';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'string';
    public $timestamps = true;

    const CREATED_AT = 'registration_date';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'id',
        'student_id',
        'studentall_id',
        'nisn', 
        'first_name', 
        'middle_name', 
        'last_name', 
        'nickname', 
        'family_rank', 
        'citizenship', 
        'country',
        'place_of_birth', 
        'date_of_birth', 
        'gender', 
        'phone_number', 
        'email',
        'photo_path',
        'card_number',
        'previous_school', 
        'religion',
        'va_mandiri',
        'va_bca',
        'va_bni',
        'va_bri',
        'academic_status_other',
        'academic_status', 
        'age',
        'nik',
        'kitas',
        'active',
        'status',
        'graduated_at'
    ];

    public function enrollments() : HasMany 
    {
        return $this->hasMany(Enrollment::class, 'id', 'id');
    }

    public function studentParent() : HasOne 
    {
        return $this->hasOne(StudentParent::class, 'id', 'id');
    }

    public function studentAddress() : HasOne 
    {
        return $this->hasOne(StudentAddress::class, 'id', 'id');
    }

    public function studentGuardian() : HasOne 
    {
        return $this->hasOne(StudentGuardian::class, 'id', 'id');
    }

    public function payments() : HasMany 
    {
        return $this->hasMany(Payment::class, 'id', 'id');
    }

    public function applicationForms() : HasManyThrough
    {
        return $this->hasManyThrough(
            ApplicationForm::class,
            Enrollment::class,
            'id',
            'enrollment_id',
            'id',
            'enrollment_id'
        );
    }

    public function getApplicationFormVersionsAttribute()
    {
        return ApplicationFormVersion::whereIn(
            'application_id',
            $this->applicationForms->pluck('application_id')
        )->get();
    }

    public function studentDiscount() : HasManyThrough
    {
        return $this->hasManyThrough(
            StudentDiscount::class,
            Enrollment::class,
            'id',
            'enrollment_id',
            'id',
            'enrollment_id'
        );
    }

    public function getDiscountTypesAttribute()
    {
        return DiscountType::whereIn(
            'discount_type_id', 
            $this->studentDiscount->pluck('discount_type_id')
            )->get();
    }

    public function guardians() : BelongsToMany
    {
        return $this->belongsToMany(
            Guardian::class,
            'student_guardians',
            'id',
            'guardian_id',
            'id',
            'guardian_id'
        );
    }

    public function guardianAddress() : HasOneThrough
    {
        return $this->hasOneThrough(
            GuardianAddress::class,
            StudentGuardian::class,
            'id',
            'guardian_id',
            'id',
            'guardian_id'
        );
    }

    public function fatherAddress() : HasOneThrough
    {
        return $this->hasOneThrough(
            FatherAddress::class,
            StudentParent::class,
            'id',
            'parent_id',
            'id',
            'parent_id'
        );
    }

    public function motherAddress() : HasOneThrough
    {
        return $this->hasOneThrough(
            MotherAddress::class,
            StudentParent::class,
            'id',
            'parent_id',
            'id',
            'parent_id'
        );
    }

    public function transportations() : HasManyThrough
    {
        return $this->hasManyThrough(
            Transportation::class,
            Enrollment::class,
            'id',
            'transport_id',
            'id',
            'transport_id',
        );
    }

    public function semester() : HasManyThrough
    {
        return $this->hasManyThrough(
            Semester::class,
            Enrollment::class,
            'id',
            'semester_id',
            'id',
            'semester_id',
        );
    }

    public function schoolClass() : HasManyThrough
    {
        return $this->hasManyThrough(
            SchoolClass::class,
            Enrollment::class,
            'id',
            'class_id',
            'id',
            'class_id',
        );
    }

    public function getSectionsAttribute() 
    {
        return $this->schoolClass->map->section->unique('section_id');
    }

    public function schoolYears() : HasManyThrough
    {
        return $this->hasManyThrough(
            SchoolYear::class,
            Enrollment::class,
            'id',
            'school_year_id',
            'id',
            'school_year_id'
        );
    }

    public function residenceHalls() : HasManyThrough
    {
        return $this->hasManyThrough(
            ResidenceHall::class,
            Enrollment::class,
            'id',
            'residence_id',
            'id',
            'residence_id'
        );
    }

    public function programs() : HasManyThrough
    {
        return $this->hasManyThrough(
            Program::class,
            Enrollment::class,
            'id',
            'program_id',
            'id',
            'program_id'
        );
    }

    public function getMajorAttribute()
    {
        return $this->schoolClass->map->major->unique('major_id');
    }

    public function getPickupPointAttribute()
    {
        return $this->transportations->map->pickupPoint->unique('pickup_point_id');
    }

    protected function latestDataSnapshot(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value,
        );
    }

};
