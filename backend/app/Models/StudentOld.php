<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentOld extends Model
{
    protected $table = 'student_old_table';
    
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'studentold_id',
        'nisn',
        'first_name',
        'middle_name',
        'last_name',
        'nickname',
        'place_of_birth',
        'date_of_birth',
        'gender',
        'student_address',
        'student_phone',
        'student_email',
        'previous_school',
        'religion',
        'nik',
        'section',
        'section_id',
        'class',
        'class_id',
        'father_name',
        'father_occupation',
        'father_company',
        'father_address',
        'father_phone',
        'father_email',
        'mother_name',
        'mother_occupation',
        'mother_company',
        'mother_address',
        'mother_phone',
        'mother_email',
        'guardian_name',
        'relation_to_student',
        'guardian_address',
        'guardian_phone',
    ];

}