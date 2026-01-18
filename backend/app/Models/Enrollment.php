<?php

namespace App\Models;

use App\Models\Program;
use App\Models\Student;
use App\Models\Semester;
use App\Models\SchoolYear;
use App\Models\SchoolClass;
use App\Models\DiscountType;
use App\Models\ResidenceHall;
use App\Models\Transportation;
use App\Models\PickupPoint;
use App\Models\ApplicationForm;
use App\Models\StudentDiscount;
use App\Models\Section;
use App\Models\Major;
use App\Models\Payment;
use App\Models\StudentParent;
use App\Models\StudentAddress;
use App\Models\StudentGuardian;
use App\Models\FatherAddress;
use App\Models\MotherAddress;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Enrollment extends Model
{
    protected $table = 'enrollments';
    protected $primaryKey = 'enrollment_id';
    public $timestamps = false;

    const CREATED_AT = 'registration_date';
    const UPDATED_AT = null;

    protected $fillable = [
        'enrollment_id',
        'id',
        'registration_id',
        'version',
        'class_id',
        'section_id',
        'major_id',
        'semester_id',
        'school_year_id',
        'program_id',
        'transport_id',
        'pickup_point_id',
        'residence_id',
        'student_status',
        'residence_hall_policy',
        'transportation_policy',
        'status',
    ];

    public function applicationForm() : HasOne
    {
        return $this->hasOne(ApplicationForm::class, 'enrollment_id', 'enrollment_id');
    }

    public function transportation() : BelongsTo
    {
        return $this->belongsTo(Transportation::class, 'transport_id', 'transport_id');
    }

    public function student() : BelongsTo
    {
        return $this->belongsTo(Student::class, 'id', 'id');
    }

    public function semester() : BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id', 'semester_id');
    }

    public function schoolClass() : BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id', 'class_id');
    }

    public function schoolYear() : BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id', 'school_year_id');
    }

    public function residenceHall() : BelongsTo
    {
        return $this->belongsTo(ResidenceHall::class, 'residence_id', 'residence_id');
    }

    public function program() : BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id', 'program_id');
    }

    public function pickupPoint(): BelongsTo
    {
        return $this->belongsTo(PickupPoint::class, 'pickup_point_id', 'pickup_point_id');
    }

    public function section() : BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id', 'section_id');
    }

    public function major() : BelongsTo
    {
        return $this->belongsTo(Major::class, 'major_id', 'major_id');
    }

    public function studentDiscount() : HasOne
    {
        return $this->hasOne(
        StudentDiscount::class, 'enrollment_id', 'enrollment_id');
    }

    public function payment() : HasOne
    {
        return $this->hasOne(Payment::class, 'enrollment_id', 'enrollment_id');
    }

    public function studentParent(): HasOne
    {
        return $this->hasOne(StudentParent::class, 'enrollment_id', 'enrollment_id');
    }

    public function studentAddress(): HasOne
    {
        return $this->hasOne(StudentAddress::class, 'enrollment_id', 'enrollment_id');
    }

    public function studentGuardian(): HasOne
    {
        return $this->hasOne(StudentGuardian::class, 'enrollment_id', 'enrollment_id');
    }

    public function fatherAddress(): HasOne
    {
        return $this->hasOne(FatherAddress::class, 'enrollment_id', 'enrollment_id');
    }

    public function motherAddress(): HasOne
    {
        return $this->hasOne(MotherAddress::class, 'enrollment_id', 'enrollment_id');
    }

    public function discountTypes() : HasManyThrough
    {
        return $this->hasManyThrough(
        DiscountType::class, 
        StudentDiscount::class,
        'enrollment_id',
        'discount_type_id',
        'enrollment_id',
        'discount_type_id'
        );
    }

    public function getPickupPoint()
    {
        return $this->transportation ? $this->transportation->pickupPoint : null;
    }

}
