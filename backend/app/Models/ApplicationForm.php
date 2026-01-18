<?php

namespace App\Models;

use App\Models\Enrollment;
use App\Models\ApplicationFormVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationForm extends Model
{
    protected $table = 'application_forms';
    protected $primaryKey = 'application_id';
    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'application_id',
        'enrollment_id', 
        'status',
        'notes',
        'submitted_at',
    ];
    
    public function enrollment() : BelongsTo
    {
        return $this->belongsTo(Enrollment::class, 'enrollment_id', 'enrollment_id');
    }
    public function versions() : HasMany
    {
        return $this->hasMany(ApplicationFormVersion::class, 'application_id', 'application_id');
    }

    public function latestVersion()
    {
        return $this->hasOne(ApplicationFormVersion::class, 'application_id', 'application_id')
                    ->where('action', 'registration')
                    ->latest('version_id');
    }

}
