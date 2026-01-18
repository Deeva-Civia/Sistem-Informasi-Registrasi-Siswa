<?php

namespace App\Models;

use App\Models\SchoolYear;
use App\Models\Section;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CancelledRegistration extends Model
{
    protected $primaryKey = 'cancelled_registration_id';

    public $timestamps = true;

    const CREATED_AT = 'cancelled_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'school_year_id',
        'section_id',
        'student_id',
        'full_name',
        'reason',
        'notes',
        'registration_id',
        'registration_date',
        'cancelled_at',
        'cancelled_by',
        'is_use_student_id',
        'student_status'
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id', 'school_year_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id', 'section_id');
    }
}
