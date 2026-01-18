<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CancelledRegistrationView extends Model
{
    protected $table = 'view_cancelled_registrations'; 
    
    public $incrementing = false;
    public $timestamps = false;
}
