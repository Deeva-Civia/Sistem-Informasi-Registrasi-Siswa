<?php

namespace App\Http\Controllers;

use App\Models\Major;
use App\Models\Program;
use App\Models\Section;
use App\Models\Semester;
use App\Models\SchoolYear;
use App\Models\PickupPoint;
use App\Models\SchoolClass;
use App\Models\DiscountType;
use Illuminate\Http\Request;
use App\Models\ResidenceHall;
use App\Models\Transportation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MasterDataController extends Controller
{
    public function addSchoolYear()
    {
        DB::beginTransaction();
        try {
            $lastSchoolYear = SchoolYear::orderByDesc('school_year_id')->lockForUpdate()->first(); 

            if (!$lastSchoolYear) {
                $newYear = date('Y') . '/' .(date('Y') + 1);
            } else {
                [$startYear,  $endYear] = explode('/', $lastSchoolYear->year);
                $nextStart = (int)$startYear + 1;
                $nextEnd = (int)$endYear + 1;
                $newYear = $nextStart . '/' . $nextEnd;
            }
    
            $schoolYear = SchoolYear::create([
                'year' => $newYear,
            ]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'New school year added successfully.',
                'school_year' => $schoolYear,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('MasterData Add SchoolYear Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add school year due to a server error.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function getRegistrationOption()
    {
        try {
            $sections = Section::select('section_id', 'name')->get();
            $majors = Major::select('major_id', 'name')->get();
            $classes = SchoolClass::select('class_id', 'grade')->get();
            
            $pickupPoints = PickupPoint::select('pickup_point_id', 'name')->get();
            
            return response()->json([
                'sections' => $sections,
                'majors' => $majors,
                'classes' => $classes,
                'programs' => Program::select('program_id', 'name')->get(),
                'school_years' => SchoolYear::select('school_year_id', 'year')->get(),
                'semesters' => Semester::select('semester_id', 'name')->get(),
                'transportations' => Transportation::select('transport_id', 'type')->get(),
                'residence_halls' => ResidenceHall::select('residence_id', 'type')->get(),
                'discount_types' => DiscountType::select('discount_type_id', 'name')->get(),
                'student_status' => ['New', 'Old', 'Transferee'],
                'academic_status' => ['REGULAR', 'SIT-IN', 'OTHER'],
                'tuition_fees' => ['Full Payment', 'Installment'],
                'residence_payment' => ['Full Payment', 'Installment'],
                'financial_policy_contract' => ['Signed', 'Not Signed'],
                'pickup_points' => $pickupPoints,
                'active_status' => ['Not Graduate', 'Graduate', 'Expelled', 'Withdraw'],
                'roles' => ['admin', 'registrar', 'head_registrar', 'teacher']
            ]);

        } catch (\Exception $e) {
            Log::error('MasterData Options Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve registration options.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
