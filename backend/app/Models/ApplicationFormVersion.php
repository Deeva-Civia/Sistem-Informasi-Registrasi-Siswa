<?php

namespace App\Models;

use App\Models\ApplicationForm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationFormVersion extends Model
{
    protected $table = 'application_form_versions';
    protected $primaryKey = 'version_id';
    public $timestamps = true;

    const CREATED_AT = null;
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'version_id',
        'application_id',
        'version',
        'updated_by',
        'action',
        'data_snapshot'
    ];

    public function applicationForm() : BelongsTo
    {
        return $this->belongsTo(ApplicationForm::class, 'application_id', 'application_id');
    }

    public function getEnrollmentAttribute() 
    {
        return $this->applicationForm ? $this->applicationForm->enrollment : null;
    }

    public function getStudentAttribute() 
    {
        return $this->enrollment ? $this->enrollment->student : null;
    }
}
