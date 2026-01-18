<?php

namespace App\Models;

use App\Models\Semester;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Draft extends Model
{
    protected $table = 'drafts';
    protected $primaryKey = 'draft_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    const CREATED_AT = 'registration_date_draft';
    const UPDATED_AT = null;

    protected $fillable = [
        'draft_id',
        'user_id',
        'school_year_id',
        'semester_id',
    ];

    public function semester() : BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id', 'semester_id');
    }

    public function schoolYear() : BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id', 'school_year_id');
    }
    
    public function user() : BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
};
