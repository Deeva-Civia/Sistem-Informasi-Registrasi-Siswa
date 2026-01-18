<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\StudentOld;
use Illuminate\Http\Request;
use App\Models\StudentParent;
use App\Models\StudentAddress;
use App\Models\StudentDiscount;
use App\Models\StudentGuardian;
use Illuminate\Support\Facades\DB;
use App\Services\AuditTrailService;
use App\Events\StudentStatusUpdated;
use App\Models\ApplicationFormVersion;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Log; 

class StudentController extends Controller
{
    protected $auditTrail;

    public function __construct(AuditTrailService $auditTrail)
    {
        $this->auditTrail = $auditTrail;
    }

    /**
     * @param \Illuminate\Http\Request $request
     */
    public function index(Request $request)
    {
        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $schoolYearStr = ($currentMonth >= 7) 
                ? $currentYear . '/' . ($currentYear + 1)
                : ($currentYear - 1) . '/' . $currentYear;
            
            $schoolYear = SchoolYear::where('year', $schoolYearStr)->first();
            $defaultSchoolYearId = $schoolYear?->school_year_id;
    
            $targetSchoolYearId = $request->input('school_year_id', $defaultSchoolYearId);
    
            $isStudentStatusFiltered = $request->filled('student_status');
    
            $latestEnrollments = DB::table('enrollments as e1')
            ->select('e1.id', 'e1.enrollment_id')
            ->when(!$isStudentStatusFiltered, function ($query) use ($targetSchoolYearId) {
                $query->where('e1.school_year_id', $targetSchoolYearId);
            })
            ->whereRaw('e1.registration_date = (
                SELECT MAX(e2.registration_date)
                FROM enrollments AS e2
                WHERE e2.id = e1.id
                ' . (!$isStudentStatusFiltered ? 'AND e2.school_year_id = e1.school_year_id' : '') . '
            )');
    
            $latestApplicationVersionSub = DB::table('application_form_versions AS afv')
            ->select(
                'afv.application_id',
                'afv.data_snapshot'
            )
            ->join('application_forms AS af', 'af.application_id', '=', 'afv.application_id')
            ->whereRaw('afv.version_id = (
                SELECT MAX(afv2.version_id) 
                FROM application_form_versions AS afv2
                WHERE afv2.application_id = afv.application_id
            )');
    
            $query = Student::select(            
                'students.id',
                'students.student_id',
                DB::raw("CONCAT_WS(' ', students.first_name, students.middle_name, students.last_name) AS full_name"),
                'students.photo_path',
                'enrollments.section_id',
                'enrollments.class_id',
                'enrollments.school_year_id',
                'school_years.year as school_year',
                'classes.grade',
                'sections.name as section_name',
                'students.status as student_status',
                'enrollments.status as enrollment_status',
                'latest_app_version.data_snapshot as latest_data_snapshot'
            )
            ->joinSub($latestEnrollments, 'latest_enrollments', function ($join) {
                $join->on('latest_enrollments.id', '=', 'students.id');
            })
            ->join('enrollments', 'enrollments.enrollment_id', '=', 'latest_enrollments.enrollment_id')
            ->join('application_forms', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
            ->leftJoinSub($latestApplicationVersionSub, 'latest_app_version', function ($join) {
                $join->on('latest_app_version.application_id', '=', 'application_forms.application_id');
            })
            ->join('school_years', 'enrollments.school_year_id', '=', 'school_years.school_year_id')
            ->leftJoin('classes', 'enrollments.class_id', '=', 'classes.class_id')
            ->leftJoin('sections', 'enrollments.section_id', '=', 'sections.section_id');
            
            $isEnrollmentStatusFiltered = $request->filled('enrollment_status');
    
            if (!$isStudentStatusFiltered && !$isEnrollmentStatusFiltered) {
                $query->where('students.active', 'YES')
                    ->where('application_forms.status', 'Confirmed');
            }
    
            // Filter Search
            if ($search = trim($request->input('search', ''))) {
                $query->where(function ($q) use ($search) {
                    $search = strtolower($search);
                    $q->whereRaw('LOWER(students.student_id) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw("LOWER(CONCAT_WS(' ', COALESCE(students.first_name,''), COALESCE(students.middle_name,''), COALESCE(students.last_name,''))) LIKE ?", ["%{$search}%"]);
                });
            } elseif ($request->filled('search_name')) {
                $searchName = strtolower(trim($request->input('search_name')));
                $query->whereRaw("LOWER(CONCAT_WS(' ', COALESCE(students.first_name,''), COALESCE(students.middle_name,''), COALESCE(students.last_name,''))) LIKE ?", ["%{$searchName}%"]);
            }
    
            // Filter checkbox
            if ($request->filled('class_id')) {
                $classIds = (array) $request->input('class_id');
                $query->whereIn('enrollments.class_id', $classIds);
            }
            if ($request->filled('section_id')) {
                $sectionIds = (array) $request->input('section_id');
                $query->whereIn('enrollments.section_id', $sectionIds);
            }
            if ($isEnrollmentStatusFiltered) {
                $enrollmentStatuses = (array) $request->input('enrollment_status');
                $query->whereIn('enrollments.status', $enrollmentStatuses);
            }
            if ($isStudentStatusFiltered) {
                $studentStatuses = (array) $request->input('student_status');
                $query->whereIn('students.status', $studentStatuses);
            }
            
            // Sort
            $sorts = $request->input('sort', []);
    
            $sortable = [
                'student_id' => 'students.student_id',
                'full_name' => "CONCAT_WS(' ', students.first_name, students.middle_name, students.last_name)",
                'grade' => 'classes.grade',
                'section' => 'sections.name',
                'enrollment_status' => 'enrollments.status',
                'student_status' => 'students.status',
            ];
            
            if (empty($sorts)) {
                $query->orderBy('students.first_name', 'asc');
            } else {
                foreach ($sorts as $sort) {
                    $field = $sort['field'] ?? null;
                    $order = strtolower($sort['order'] ?? 'asc');
    
                    if (!$field || !array_key_exists($field, $sortable)) continue;
    
                    if ($field === 'full_name') {
                        $query->orderByRaw($sortable[$field] . ' ' . $order);
                    } else {
                        $query->orderBy($sortable[$field], $order);
                    }
                }
            }
    
            // Pagination
            $perPage = $request->input('per_page', 25);
            $students= $query->paginate($perPage);
    
            // Transform data (photo_url)
            $students->getCollection()->transform(function ($student) {
                $photoUrl = null;
                try {
                    if ($student->latest_data_snapshot) {
                        $decode = json_decode($student->latest_data_snapshot);
                        $photoUrl = $decode->request_data->photo_url ?? null;
                    } 
                    unset($student->latest_data_snapshot); 
                    $student->photo_url = $photoUrl;
                    return $student;
    
                } catch (\Exception $e) {
                }
    
                $student->photo_url = $photoUrl;
    
                return $student;
            });
            
            return response()->json([
                'success' => true,
                'data' => $students,
                'meta' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Student Index Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student list.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function autoGraduatePreview(Request $request)
    {
        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;
    
            $schoolYearStr = ($currentMonth >= 7)
                ? $currentYear . '/' . ($currentYear + 1)
                : ($currentYear - 1) . '/' . $currentYear;
    
            $currentSchoolYear = SchoolYear::where('year', $schoolYearStr)->first();
    
            if (!$currentSchoolYear) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current school year is not defined.'
                ], 400);
            }
    
            $currentSchoolYearId = $currentSchoolYear->school_year_id;
    
            $graduatingGrades = ['K2', '6', '9', '12'];
    
            $latestEnrollments = DB::table('enrollments as e1')
                ->select('e1.id', 'e1.enrollment_id')
                ->where('e1.school_year_id', $currentSchoolYearId)
                ->whereRaw('e1.registration_date = (
                    SELECT MAX(e2.registration_date)
                    FROM enrollments AS e2
                    WHERE e2.id = e1.id
                    AND e2.school_year_id = e1.school_year_id
                )');
    
            $students = Student::select(
                'students.id',
                'students.student_id',
                DB::raw("CONCAT_WS(' ', students.first_name, students.middle_name, students.last_name) AS full_name"),
                'classes.grade',
                'sections.name AS section_name',
                'sections.section_id',
                'school_years.year AS school_year',
                'students.status',
                'students.active',
                'enrollments.status AS enrollment_status'
            )
                ->joinSub($latestEnrollments, 'latest_enrollments', function ($join) {
                    $join->on('latest_enrollments.id', '=', 'students.id');
                })
                ->join('enrollments', 'enrollments.enrollment_id', '=', 'latest_enrollments.enrollment_id')
                ->join('school_years', 'school_years.school_year_id', '=', 'enrollments.school_year_id')
                ->leftJoin('classes', 'classes.class_id', '=', 'enrollments.class_id')
                ->leftJoin('sections', 'sections.section_id', '=', 'enrollments.section_id')
                ->whereIn('classes.grade', $graduatingGrades)
                ->where('students.active', 'YES')
                ->where('school_years.school_year_id', $currentSchoolYearId)
                ->orderBy('sections.section_id', 'asc') 
                ->orderBy('classes.grade', 'asc')
                ->orderBy('students.first_name', 'asc')
                ->get();
    
            return response()->json([
                'success' => true,
                'current_school_year' => $currentSchoolYear->year,
                'total_students' => $students->count(),
                'students' => $students
            ]);

        } catch (\Exception $e) {
            Log::error('Auto Graduate Preview Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate auto-graduate preview.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function autoGraduateConfirm(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:students,id'
        ]);

        try {
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $schoolYearStr = ($currentMonth >= 7)
                ? $currentYear . '/' . ($currentYear + 1)
                : ($currentYear - 1) . '/' . $currentYear;
            
            $currentSchoolYear = SchoolYear::where('year', $schoolYearStr)->first();
            $schoolYearLog = $currentSchoolYear ? $currentSchoolYear->year : $schoolYearStr;
    
            $students = Student::select(
                    'students.id', 
                    'students.student_id', 
                    'students.first_name', 
                    'students.middle_name', 
                    'students.last_name',
                    'students.status', 
                    'students.active', 
                    'classes.grade'    
                )
                ->join('enrollments', 'students.id', '=', 'enrollments.id')
                ->join('classes', 'enrollments.class_id', '=', 'classes.class_id')
                ->whereIn('students.id', $request->ids)
                ->where('enrollments.status', 'ACTIVE') 
                ->get();
    
            $studentDataList = [];
            foreach ($students as $index => $student) {
                $fullName = trim("{$student->first_name} {$student->middle_name} {$student->last_name}");
                $studentDataList[] = ($index + 1) . ". {$fullName} (student id: {$student->student_id}) (grade: {$student->grade})";
            }
    
            $firstStudent = $students->first();
            $oldStatus = $firstStudent ? $firstStudent->status : 'Active'; 
            $oldActive = $firstStudent ? $firstStudent->active : 'YES';
            
            DB::transaction(function () use ($request, $studentDataList, $schoolYearLog, $oldStatus, $oldActive) {
    
                Student::whereIn('id', $request->ids)
                    ->update([
                        'status' => 'Graduate',
                        'active' => 'NO',
                        'graduated_at' => now(),
                        'updated_at' => now(),
                ]);
                
                Enrollment::whereIn('id', $request->ids) 
                    ->where('status', 'ACTIVE')
                    ->update([
                        'status' => 'INACTIVE'
                ]);
    
                $this->auditTrail->log('auto_graduate', [
                    'school_year'  => $schoolYearLog,
                    'student_data' => $studentDataList,
                    'changes'      => [
                        'status' => [
                            'from' => $oldStatus, 
                            'to'   => 'Graduate'
                        ],
                        'active' => [
                            'from' => $oldActive,
                            'to'   => 'NO'
                        ],
                        'graduated_at' => now()->toDateTimeString()
                    ],
                    'description'  => 'Student automatically graduated via Bulk Action.'
                ]);
            });
    
            foreach ($students as $student) {
                StudentStatusUpdated::dispatch($student);
            }
    
            return response()->json([
                'success' => true,
                'message' => 'Selected students have been successfully graduated.'
            ]);

        } catch (\Exception $e) {
            Log::error('Auto Graduate Confirm Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process auto-graduation.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function searchStudents(Request $request)
    {
        try {
            $keyword = $request->input('search');
            if (!$keyword) {
                return response()->json(['new' => [], 'old' => []]);
            }
    
            // new database
            $students = Student::select(
                    'id',
                    'student_id',
                    DB::raw("CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name"),
                    'nisn',
                    'nik',
                    'registration_date',
                    DB::raw("'new' as source")
                )
                ->where(function ($query) use ($keyword) {
                    $query->where('student_id', 'like', "%$keyword%")
                        ->orWhere('first_name', 'like', "%$keyword%")
                        ->orWhere('middle_name', 'like', "%$keyword%")
                        ->orWhere('last_name', 'like', "%$keyword%")
                        ->orWhere(DB::raw("CONCAT_WS(' ', first_name, middle_name, last_name)"), 'like', "%$keyword%");
                })
                ->orderBy('registration_date', 'desc') 
                ->limit(50) 
                ->get()
                ->unique(function ($item) {
                    return $item->nisn . '|' . $item->nik;
                })
                ->values()
                ->take(10); 
                
                // old database
                $studentOld = StudentOld::select(
                        'id',
                        DB::raw('studentold_id as student_id'),
                        DB::raw("CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name"),
                        'nisn',
                        'nik',
                        DB::raw('NULL as registration_date'),
                        'section_id',
                        DB::raw("'old' as source")
                    )
                    ->where(function ($query) use ($keyword) {
                        $query->where('studentold_id', 'like', "%$keyword%")
                            ->orWhere('first_name', 'like', "%$keyword%")
                            ->orWhere('middle_name', 'like', "%$keyword%")
                            ->orWhere('last_name', 'like', "%$keyword%")
                            ->orWhere(DB::raw("CONCAT_WS(' ', first_name, middle_name, last_name)"), 'like', "%$keyword%");
                    })
                    ->orderByDesc('section_id')
                    ->limit(50)
                    ->get();
    
            $response = [
                'new' => $students->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'student_id' => $item->student_id,
                        'full_name' => $item->full_name,
                        'nisn' => $item->nisn,
                        'nik' => $item->nik,
                        'registration_date' => $item->registration_date,
                        'source' => 'new'
                    ];
                })->values(),
    
                'old' => $studentOld->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'student_id' => $item->student_id,
                        'full_name' => $item->full_name,
                        'nisn' => $item->nisn,
                        'nik' => $item->nik,
                        'section_id' => $item->section_id,
                        'source' => 'old'
                    ];
                })->values(),
            ];
    
            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Search Students Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to search students.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function getLatestApplication($id, Request $request)
    {
        try {
            $source = $request->input('source', 'new');
            
            if ($source === 'old') {
                $student = StudentOld::where('id', $id)
                    ->orderByDesc('section_id')
                    ->first();
    
                if (!$student) {
                    return response()->json(
                        [
                            'success' => false,
                            'error' => 'No old student found with this ID',
                        ], 404
                    );
                }
    
                $formattedData = [
                    'studentInfo' => [
                        'first_name' => $student->first_name ?? '',
                        'middle_name' => $student->middle_name ?? '',
                        'last_name' => $student->last_name ?? '',
                        'nickname' => $student->nickname ?? '',
                        'religion' => $student->religion ?? '',
                        'place_of_birth' => $student->place_of_birth ?? '',
                        'date_of_birth' => $student->date_of_birth ?? '',
                        'email' => $student->student_email ?? '',
                        'phone_number' => $student->student_phone ?? '',
                        'previous_school' => $student->previous_school ?? '',
                        'gender' => $student->gender ?? '',
                        'nisn' => $student->nisn ?? '',
                        'nik' => $student->nik ?? '',
                        'street' => $student->student_address ?? '',
                    ],
                    'program' => [
                        'section_id' => $student->section_id ?? '',
                        'class_id' => $student->class_id ?? '',
                    ],
                    'parentGuardian' => [
                        'father_name' => $student->father_name ?? '',
                        'father_company' => $student->father_company ?? '',
                        'father_occupation' => $student->father_occupation ?? '',
                        'father_phone' => $student->father_phone ?? '',
                        'father_email' => $student->father_email ?? '',
                        'father_address_street' => $student->father_address ?? '',
                        'mother_name' => $student->mother_name ?? '',
                        'mother_company' => $student->mother_company ?? '',
                        'mother_occupation' => $student->mother_occupation ?? '',
                        'mother_phone' => $student->mother_phone ?? '',
                        'mother_email' => $student->mother_email ?? '',
                        'mother_address_street' => $student->mother_address ?? '',
                        'guardian_name' => $student->guardian_name ?? '',
                        'relation_to_student' => $student->relation_to_student ?? '',
                        'guardian_phone' => $student->guardian_phone ?? '',
                        'guardian_address_street' => $student->guardian_address ?? '',
                    ],
                    'student_status' => 'Old',
                    'input_name' => $student->studentold_id,
                    'student_id' => $student->studentold_id
                ];
    
                return response()->json([
                    'success' => true,
                    'data' => $formattedData
                ]);
            }
    
            $latestVersion = ApplicationFormVersion::with([
                'applicationForm.enrollment.student',
                'applicationForm.enrollment.section'
                ])
                ->whereHas('applicationForm.enrollment.student', function ($q) use ($id) {
                    $q->where('id', $id);
                })
                ->orderByDesc('version_id')
                ->first();
    
            if (!$latestVersion) {
                return response()->json([
                    'success' => false,
                    'error' => 'No application found for this student',
                ], 404);
            }
    
            $dataSnapshot = $latestVersion->data_snapshot ? json_decode($latestVersion->data_snapshot, true) : [];
            $enrollment = $latestVersion->applicationForm->enrollment ?? null;
            $student = $enrollment->student ?? null;
    
            // Extract request_data from snapshot
            $requestData = $dataSnapshot['request_data'] ?? [];
            
            $rawPhotoPath = $requestData['photo_url'] ?? null;
            $processedPhotoUrl = '';
    
            if ($rawPhotoPath) {
                $pathOnly = parse_url($rawPhotoPath, PHP_URL_PATH);
                
                if (!$pathOnly) {
                    $pathOnly = $rawPhotoPath;
                }
    
                // 2. Bersihkan slash di depan
                $pathOnly = ltrim($pathOnly, '/');
    
                // 3. Hapus prefix "storage/"
                $cleanPath = preg_replace('/^storage\//', '', $pathOnly);
    
                // 4. Generate URL Proxy yang bersih
                $processedPhotoUrl = URL::to("api/storage-file/{$cleanPath}");
            }
    
            // For ID CARD
            $schoolYearRaw = $requestData['school_year'] ?? null;
            $validUntil = null;
    
            if ($schoolYearRaw) {
                $parts = explode('/', $schoolYearRaw);
                if (count($parts) >= 2) {
                    $endYear = trim($parts[1]);  
                    $validUntil = "31/07/" . $endYear; 
                }
            }
    
            $firstName = $requestData['first_name'] ?? '';
            $middleName = $requestData['middle_name'] ?? '';
            $lastName = $requestData['last_name'] ?? '';
    
            $realSectionId = $enrollment->section_id ?? $requestData['section_id'] ?? '';
            $realSectionName = $enrollment->section->name ?? '';
    
            $idCardData = [
                'first_name'     => $firstName,
                'middle_name'    => $middleName,
                'last_name'      => $lastName,
                'student_id'     => $student->student_id ?? $requestData['student_id'] ?? '',
                'nisn'           => $requestData['nisn'] ?? '',
                'place_of_birth' => $requestData['place_of_birth'] ?? '',
                'date_of_birth'  => $requestData['date_of_birth'] ?? '',
                'section_name'   => $realSectionName, 
                'school_year'    => $schoolYearRaw,
                'valid_until'    => $validUntil, 
                'photo_url'      => $processedPhotoUrl,
                'card_number'    => $student->card_number ?? null, 
            ];
            
            $formattedData = [
                'studentInfo' => [
                    'first_name' => $requestData['first_name'] ?? '',
                    'middle_name' => $requestData['middle_name'] ?? '',
                    'last_name' => $requestData['last_name'] ?? '',
                    'nickname' => $requestData['nickname'] ?? '',
                    'citizenship' => $requestData['citizenship'] ?? '',
                    'country' => $requestData['country'] ?? '',
                    'religion' => $requestData['religion'] ?? '',
                    'place_of_birth' => $requestData['place_of_birth'] ?? '',
                    'date_of_birth' => $requestData['date_of_birth'] ?? '',
                    'email' => $requestData['email'] ?? '',
                    'phone_number' => $requestData['phone_number'] ?? '',
                    'previous_school' => $requestData['previous_school'] ?? '',
                    'academic_status' => $requestData['academic_status'] ?? '',
                    'academic_status_other' => $requestData['academic_status_other'] ?? '',
                    'gender' => $requestData['gender'] ?? '',
                    'family_rank' => $requestData['family_rank'] ?? '',
                    'nisn' => $requestData['nisn'] ?? '',
                    'nik' => $requestData['nik'] ?? '',
                    'kitas' => $requestData['kitas'] ?? '',
                    'va_mandiri' => $student->va_mandiri ?? '',
                    'va_bca' => $student->va_bca ?? '',
                    'va_bni' => $student->va_bni ?? '',
                    'va_bri' => $student->va_bri ?? '',
                    'street' => $requestData['street'] ?? '',
                    'rt' => $requestData['rt'] ?? '',
                    'rw' => $requestData['rw'] ?? '',
                    'village' => $requestData['village'] ?? '',
                    'district' => $requestData['district'] ?? '',
                    'city_regency' => $requestData['city_regency'] ?? '',
                    'province' => $requestData['province'] ?? '',
                    'other' => $requestData['other'] ?? '',
                    'photo_url' => $processedPhotoUrl,
                    'student_active' => $latestVersion->applicationForm?->enrollment?->student?->active ?? '',
                    'status' => $latestVersion->applicationForm?->enrollment?->student?->status ?? '',
                ],
                'program' => [
                    'section_id' => $requestData['section_id'] ?? '',
                    'program_id' => $requestData['program_id'] ?? '',
                    'class_id' => $requestData['class_id'] ?? '',
                    'major_id' => $requestData['major_id'] ?? '',
                    'program_other' => $requestData['program_other'] ?? '',
                    'school_year_id' => $requestData['school_year_id'] ?? '',
                    'school_year' => $requestData['school_year'] ?? '', 
                ],
                'facilities' => [
                    'transportation_id' => $requestData['transportation_id'] ?? '',
                    'pickup_point_id' => $requestData['pickup_point_id'] ?? '',
                    'pickup_point_custom' => $requestData['pickup_point_custom'] ?? '',
                    'transportation_policy' => $requestData['transportation_policy'] ?? '',
                    'residence_id' => $requestData['residence_id'] ?? '',
                    'residence_hall_policy' => $requestData['residence_hall_policy'] ?? '',
                ],
                'parentGuardian' => [
                    'father_name' => $requestData['father_name'] ?? '',
                    'father_company' => $requestData['father_company'] ?? '',
                    'father_occupation' => $requestData['father_occupation'] ?? '',
                    'father_phone' => $requestData['father_phone'] ?? '',
                    'father_email' => $requestData['father_email'] ?? '',
                    'father_address_street' => $requestData['father_address_street'] ?? '',
                    'father_address_rt' => $requestData['father_address_rt'] ?? '',
                    'father_address_rw' => $requestData['father_address_rw'] ?? '',
                    'father_address_village' => $requestData['father_address_village'] ?? '',
                    'father_address_district' => $requestData['father_address_district'] ?? '',
                    'father_address_city_regency' => $requestData['father_address_city_regency'] ?? '',
                    'father_address_province' => $requestData['father_address_province'] ?? '',
                    'father_address_other' => $requestData['father_address_other'] ?? '',
                    'father_company_addresses' => $requestData['father_company_addresses'] ?? '',
                    'mother_name' => $requestData['mother_name'] ?? '',
                    'mother_company' => $requestData['mother_company'] ?? '',
                    'mother_occupation' => $requestData['mother_occupation'] ?? '',
                    'mother_phone' => $requestData['mother_phone'] ?? '',
                    'mother_email' => $requestData['mother_email'] ?? '',
                    'mother_address_street' => $requestData['mother_address_street'] ?? '',
                    'mother_address_rt' => $requestData['mother_address_rt'] ?? '',
                    'mother_address_rw' => $requestData['mother_address_rw'] ?? '',
                    'mother_address_village' => $requestData['mother_address_village'] ?? '',
                    'mother_address_district' => $requestData['mother_address_district'] ?? '',
                    'mother_address_city_regency' => $requestData['mother_address_city_regency'] ?? '',
                    'mother_address_province' => $requestData['mother_address_province'] ?? '',
                    'mother_address_other' => $requestData['mother_address_other'] ?? '',
                    'mother_company_addresses' => $requestData['mother_company_addresses'] ?? '',
                    'guardian_name' => $requestData['guardian_name'] ?? '',
                    'relation_to_student' => $requestData['relation_to_student'] ?? '',
                    'guardian_phone' => $requestData['guardian_phone'] ?? '',
                    'guardian_email' => $requestData['guardian_email'] ?? '',
                    'guardian_address_street' => $requestData['guardian_address_street'] ?? '',
                    'guardian_address_rt' => $requestData['guardian_address_rt'] ?? '',
                    'guardian_address_rw' => $requestData['guardian_address_rw'] ?? '',
                    'guardian_address_village' => $requestData['guardian_address_village'] ?? '',
                    'guardian_address_district' => $requestData['guardian_address_district'] ?? '',
                    'guardian_address_city_regency' => $requestData['guardian_address_city_regency'] ?? '',
                    'guardian_address_province' => $requestData['guardian_address_province'] ?? '',
                    'guardian_address_other' => $requestData['guardian_address_other'] ?? '',
                ],
                'termOfPayment' => [
                    'tuition_fees' => $requestData['tuition_fees'] ?? '',
                    'residence_payment' => $requestData['residence_payment'] ?? '',
                    'financial_policy_contract' => $requestData['financial_policy_contract'] ?? '',
                    'discount_name' => $requestData['discount_name'] ?? '',
                    'discount_notes' => $requestData['discount_notes'] ?? '',
                ],
                'enrollment_status' => $requestData['enrollment_status'] ?? '',
                'application_form_status' => $requestData['application_form_status'] ?? '',
                'student_status' => 'Old',
                'input_name' => $student->id ?? null,
                'student_id' => $student->student_id ?? null,
                'application_id' => $latestVersion->application_id,
                'version_id' => $latestVersion->version_id,
                'idCardInfo' => $idCardData, 
            ];
    
            return response()->json([
                'success' => true,
                'data' => $formattedData,
            ]);

        } catch (\Exception $e) {
            Log::error('Get Latest Application Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student application details.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function updateStudent(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $latestVersion = ApplicationFormVersion::with('applicationForm.enrollment.student')
                ->whereHas('applicationForm.enrollment.student', function ($q) use ($id) {
                    $q->where('id', $id);
                })
                ->orderByDesc('version_id')
                ->first();

            if (!$latestVersion) {
                return response()->json([
                    'success' => false,
                    'error' => 'No application found for this student',
                ], 404);
            }

            $student = Student::with(['studentAddress', 'studentParent', 'studentGuardian', 'enrollments'])
                ->findOrFail($id);

            $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();
            
            $currentSectionId = $latestEnrollment->section_id ?? null;

            // Map: [section_id => [min_class_id, max_class_id]]
            $classIdRanges = [
                1 => [1, 3],   
                2 => [4, 9],   
                3 => [10, 12], 
                4 => [13, 15],
            ];

            $validated = $request->validate([
                // Student
                'first_name'   => 'sometimes|required|string',
                'middle_name'  => 'sometimes|nullable|string',
                'last_name'    => 'sometimes|nullable|string',
                'nickname'     => 'sometimes|required|string',
                'citizenship' => 'sometimes|required|in:Indonesia,Non Indonesia',
                'country' => 'sometimes|nullable',
                'religion'     => 'sometimes|required|in:Islam,Kristen,Katolik,Hindu,Buddha,Konghucu,Kristen Advent',
                'place_of_birth' => 'sometimes|required|string',
                'date_of_birth' => 'sometimes|required|date',
                'gender' => 'sometimes|required|string',
                'family_rank' => 'sometimes|required|string',
                'email'        => 'sometimes|required|email',
                'phone_number' => 'sometimes|required|string|max:20',
                'previous_school' => 'sometimes|nullable|string',
                'nisn' => 'sometimes|required|string',
                'nik' => 'sometimes|nullable|required_if:citizenship,Indonesia|integer',
                'kitas' => 'sometimes|nullable|required_if:citizenship,Non Indonesia|string',                
                'photo' => 'sometimes|nullable|image|mimes:jpeg,png,jpg|max:5048',
                'status' => 'sometimes|required|in:Not Graduate,Graduate,Expelled,Withdraw',
                'va_mandiri' => 'sometimes|nullable|string',
                'va_bca' => 'sometimes|nullable|string',
                'va_bni' => 'sometimes|nullable|string',
                'va_bri' => 'sometimes|nullable|string',

                // Address
                'street'       => 'sometimes|required|string',
                'rt' => 'sometimes|nullable|string',
                'rw' => 'sometimes|nullable|string',
                'village' => 'sometimes|required|string',
                'district' => 'sometimes|required|string',
                'city_regency' => 'sometimes|required|string',
                'province'     => 'sometimes|required|string',
                'other'     => 'sometimes|nullable|string',

                // Parent
                'father_name' => 'sometimes|required|string',
                'father_company' => 'sometimes|nullable|string',
                'father_occupation' => 'sometimes|nullable|string',
                'father_phone' => 'sometimes|required|string',
                'father_email' => 'sometimes|required|email',
                'father_address_street' => 'sometimes|required|string',
                'father_address_rt' => 'sometimes|nullable|string',
                'father_address_rw' => 'sometimes|nullable|string',
                'father_address_village' => 'sometimes|required|string',
                'father_address_district' => 'sometimes|required|string',
                'father_address_city_regency' => 'sometimes|required|string',
                'father_address_province' => 'sometimes|required|string',
                'father_address_other' => 'sometimes|nullable|string',

                'mother_name' => 'sometimes|required|string',
                'mother_company' => 'sometimes|nullable|string',
                'mother_occupation' => 'sometimes|nullable|string',
                'mother_phone' => 'sometimes|required|string',
                'mother_email' => 'sometimes|required|email', 
                'mother_address_street' => 'sometimes|required|string',
                'mother_address_rt' => 'sometimes|nullable|string',
                'mother_address_rw' => 'sometimes|nullable|string',
                'mother_address_village' => 'sometimes|required|string',
                'mother_address_district' => 'sometimes|required|string',
                'mother_address_city_regency' => 'sometimes|required|string',
                'mother_address_province' => 'sometimes|required|string',
                'mother_address_other' => 'sometimes|nullable|string',

                // Guardian
                'guardian_name' => 'sometimes|nullable|string',
                'relation_to_student' => 'sometimes|nullable|string',
                'guardian_phone' => 'sometimes|nullable|string',
                'guardian_email' => 'sometimes|nullable|email',
                'guardian_address_street' => 'sometimes|nullable|string',
                'guardian_address_rt' => 'sometimes|nullable|string',
                'guardian_address_rw' => 'sometimes|nullable|string',
                'guardian_address_village' => 'sometimes|nullable|string',
                'guardian_address_district' => 'sometimes|nullable|string',
                'guardian_address_city_regency' => 'sometimes|nullable|string',
                'guardian_address_province' => 'sometimes|nullable|string',
                'guardian_address_other' => 'sometimes|nullable|string',

                // Enrollment
                'residence_id' => 'sometimes|required|exists:residence_halls,residence_id',
                'transportation_id' => 'sometimes|nullable|exists:transportations,transport_id',
                'pickup_point_id' => 'sometimes|nullable|exists:pickup_points,pickup_point_id',
                'pickup_point_custom' => 'sometimes|nullable|string',
                'residence_hall_policy'  => 'sometimes|required|string',
                'transportation_policy'  => 'sometimes|required|string',
                'program_id' => 'sometimes|nullable|exists:programs,program_id',
                'major_id' => 'sometimes|required|exists:majors,major_id',
                'class_id' => [
                    'sometimes', 
                    'required', 
                    'exists:classes,class_id',
                    function ($attribute, $value, $fail) use ($currentSectionId, $classIdRanges) {
                        if (!$currentSectionId) {
                            return $fail('Student does not have an active enrollment section to validate the class.');
                        }

                        if (!isset($classIdRanges[$currentSectionId])) {
                            return $fail("Invalid section ID ($currentSectionId) configured for class validation.");
                        }

                        [$min, $max] = $classIdRanges[$currentSectionId];

                        if ($value < $min || $value > $max) {
                            $fail("The selected class is not valid for the current student's section (Section ID: {$currentSectionId}). Valid range is class ID {$min} to {$max}.");
                        }
                    }
                ],

                // Payment
                'tuition_fees' => 'sometimes|required_with:tuition_fees|in:Full Payment,Installment',
                'residence_payment' => 'sometimes|nullable|required_unless:residence_id,3|in:Full Payment,Installment',
                'financial_policy_contract' => 'sometimes|required_with:financial_policy_contract|in:Signed,Not Signed',
                'discount_name' => 'sometimes|nullable|exists:discount_types,discount_type_id',
                'discount_notes' => 'sometimes|nullable|string',
            ]);
            
            $auditChanges = [];
            
            // Update student
            $studentData = collect($validated)->except(['academic_status', 'academic_status_other'])->toArray();
            $student->fill($studentData);
            
            $shouldClearCache = false; 
            if ($student->isDirty('status')) {
                $newStatus = $student->status;
                $inactiveStatuses = ['graduate', 'expelled', 'withdraw'];
                $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();

                $currentMonth = now()->month;
                $currentYear = now()->year;
                $schoolYearStr = ($currentMonth >= 7)
                    ? $currentYear . '/' . ($currentYear + 1)
                    : ($currentYear - 1) . '/' . $currentYear;

                $schoolYear = SchoolYear::where('year', $schoolYearStr)->first();
                $currentSchoolYearId = $schoolYear?->school_year_id;

                if (in_array(strtolower($newStatus), $inactiveStatuses)) {
                    $student->active = 'NO';
                    $shouldClearCache = true; 
                    $student->updated_at = now();
                    if ($newStatus === 'Graduate') {
                        $student->graduated_at = now();
                    }
                    if ($latestEnrollment) {
                        $latestEnrollment->status = 'INACTIVE';
                        $latestEnrollment->save();
                    }
                } else {
                    $student->active = 'YES';
                    $shouldClearCache = true; 
                    $student->updated_at = now();
                    if ($latestEnrollment) {
                        $latestEnrollment->status =
                            ($currentSchoolYearId && $latestEnrollment->school_year_id === $currentSchoolYearId)
                            ? 'ACTIVE'
                            : 'INACTIVE';
                        $latestEnrollment->save();
                    }
                }
            }

            $studentChanges = $student->getDirty();
            $student->save();

            $auditChanges = array_merge($auditChanges, collect($studentChanges)->except('updated_at')->toArray());

            if ($request->hasFile('photo')) {
                $timestamp = now()->format('Y-m-d_H-i-s');
                $extension = $request->file('photo')->getClientOriginalExtension();
                $fileName = "{$timestamp}.{$extension}";
                $folder = "students/{$student->student_id}";
                $photoPath = $request->file('photo')->storeAs($folder, $fileName, 'public');
                $student->photo_path = $photoPath;
                $student->save();
                $auditChanges['photo'] = 'Updated Photo';
            }

            // Update student address
            if ($request->hasAny(['street', 'city_regency', 'province'])) {
                $address = $student->studentAddress ?? new StudentAddress(['id' => $student->id]);
                $address->fill($request->only(['street', 'city_regency', 'province']));

                if ($address->isDirty()) {
                    $changes = $address->getDirty();
                    $address->save();
                    $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at', 'id'])->toArray());
                }
            }

            // Update parent
            if ($request->hasAny(['father_name', 'mother_name'])) {
                $parent = $student->studentParent ?? new StudentParent(['id' => $student->id]);
                $parent->fill($request->only([
                        'father_name', 'father_company', 'father_occupation', 'father_phone', 'father_email',
                        'father_address_street', 'father_address_rt', 'father_address_rw', 'father_address_village',
                        'father_address_district', 'father_address_city_regency', 'father_address_province', 'father_address_other',
                        'father_company_addresses',
                        'mother_name', 'mother_company', 'mother_occupation', 'mother_phone', 'mother_email',
                        'mother_address_street', 'mother_address_rt', 'mother_address_rw', 'mother_address_village',
                        'mother_address_district', 'mother_address_city_regency', 'mother_address_province', 'mother_address_other',
                        'mother_company_addresses',
                ]));

                if ($parent->isDirty()) {
                    $changes = $parent->getDirty();
                    $parent->save();
                    $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at', 'id'])->toArray());
                }
            }

            // Update guardian
            if ($request->hasAny(['guardian_name'])) {
                $guardian = $student->studentGuardian ?? new StudentGuardian(['id' => $student->id]);
                $guardian->fill($request->only([
                        'guardian_name', 'relation_to_student', 'guardian_phone', 'guardian_email',
                        'guardian_address_street', 'guardian_address_rt', 'guardian_address_rw', 'guardian_address_village',
                        'guardian_address_district', 'guardian_address_city_regency', 'guardian_address_province', 'guardian_address_other',
                ]));
                
                if ($guardian->isDirty()) {
                    $changes = $guardian->getDirty();
                    $guardian->save();
                    $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at', 'id'])->toArray());
                }
            }

            // Update enrollment
            if ($request->hasAny([
                'residence_id', 'transportation_id', 'pickup_point_id',
                'pickup_point_custom', 'residence_hall_policy', 'transportation_policy', 
                'major_id', 'class_id', 'program_id'
            ])) {

                $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();

                if ($latestEnrollment) {
                    $latestEnrollment->fill([
                        'residence_id'          => $request->residence_id ?? $latestEnrollment->residence_id,
                        'transportation_id'     => $request->transportation_id ?? $latestEnrollment->transportation_id,
                        'pickup_point_id'       => $request->pickup_point_id ?? $latestEnrollment->pickup_point_id,
                        'pickup_point_custom'   => $request->pickup_point_custom ?? $latestEnrollment->pickup_point_custom,
                        'residence_hall_policy' => $request->residence_hall_policy ?? $latestEnrollment->residence_hall_policy,
                        'transportation_policy' => $request->transportation_policy ?? $latestEnrollment->transportation_policy,
                        'major_id'              => $request->major_id ?? $latestEnrollment->major_id,
                        'class_id'              => $request->class_id ?? $latestEnrollment->class_id,
                        'program_id'              => $request->program_id ?? $latestEnrollment->program_id,
                    ]);

                    if ($latestEnrollment->isDirty()) {
                        $changes = $latestEnrollment->getDirty();
                        $latestEnrollment->save();
                        $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at'])->toArray());
                    }
                } else {
                    $student->enrollments()->create([
                        'residence_id'          => $request->residence_id,
                        'transportation_id'     => $request->transportation_id,
                        'pickup_point_id'       => $request->pickup_point_id,
                        'pickup_point_custom'   => $request->pickup_point_custom,
                        'residence_hall_policy' => $request->residence_hall_policy,
                        'transportation_policy' => $request->transportation_policy,
                        'major_id'              => $request->major_id,
                        'class_id'              => $request->class_id,
                        'program_id'          => $request->program_id, 
                    ]);
                }
            }

            // Update payment
            if ($request->hasAny(['tuition_fees', 'residence_payment', 'financial_policy_contract'])) {
                $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();
                if ($latestEnrollment) {
                    $payment = Payment::where('enrollment_id', $latestEnrollment->enrollment_id)->first();
                    
                    if ($payment) {
                        $payment->fill($request->only(['tuition_fees', 'residence_payment', 'financial_policy_contract']));

                        if ($payment->isDirty()) {
                            $changes = $payment->getDirty();
                            $payment->save();
                            $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at', 'id'])->toArray());
                        }
                    }
                }
            }

            // Update discount
            if ($request->hasAny(['discount_name', 'discount_notes'])) {
                $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();
                
                if ($latestEnrollment) {
                    $studentDiscount = StudentDiscount::firstOrNew(
                        ['enrollment_id' => $latestEnrollment->enrollment_id]
                    );
                    
                    $discountData = [];
                    if ($request->has('discount_name')) {
                        $studentDiscount->discount_type_id = $validated['discount_name'];
                    }
                    if ($request->has('discount_notes')) {
                        $studentDiscount->notes = $validated['discount_notes'];
                    }
                    
                    $studentDiscount->fill($discountData);

                    if ($studentDiscount->isDirty()) {
                        $changes = $studentDiscount->getDirty();
                        $studentDiscount->save();
                        $auditChanges = array_merge($auditChanges, collect($changes)->except(['updated_at', 'id'])->toArray());
                    }
                }
            }

            $oldSnapshot = $latestVersion->data_snapshot ? json_decode($latestVersion->data_snapshot, true) : [];
            $oldRequestData = $oldSnapshot['request_data'] ?? [];

            $newRequestData = array_merge($oldRequestData, $validated);
            unset($newRequestData['photo']);

            $newRequestData['student_active'] = $student->active;
            unset($newRequestData['active']);
            
            if ($student->photo_path) {
                $newRequestData['photo_path'] = $student->photo_path;
                $newRequestData['photo_url']  = asset('storage/' . $student->photo_path);
            }

            $latestEnrollment = $student->enrollments->sortByDesc('registration_date')->first();
            $latestEnrollment->refresh();
            $newRequestData['enrollment_status'] = $latestEnrollment->status;

            $latestEnrollment->load('semester', 'schoolYear', 'payment', 'studentDiscount' ); 
            if ($latestEnrollment->payment) {
                $newRequestData['tuition_fees'] = $latestEnrollment->payment->tuition_fees;
                $newRequestData['residence_payment'] = $latestEnrollment->payment->residence_payment;
                $newRequestData['financial_policy_contract'] = $latestEnrollment->payment->financial_policy_contract;
            }

            if ($latestEnrollment->studentDiscount) {
                $newRequestData['discount_name'] = $latestEnrollment->studentDiscount->discount_type_id;
                $newRequestData['discount_notes'] = $latestEnrollment->studentDiscount->notes;
            }

            $newRequestData['class_id'] = $latestEnrollment->class_id;
            $newRequestData['major_id'] = $latestEnrollment->major_id;
            $newRequestData['program_id'] = $latestEnrollment->program_id;

            $newSnapshot = [
                'id'             => $student->id,
                'student_id'     => $student->student_id,
                'registration_id' => $latestEnrollment?->registration_id,
                'enrollment_id'  => $latestEnrollment?->enrollment_id,
                'registration_number' => $oldSnapshot['registration_number'] ?? null, 
                'registration_date' =>$latestEnrollment?->registration_date,
                'application_id' => $latestVersion->application_id,
                'semester'     => $latestEnrollment?->semester->number,        
                'school_year'  => $latestEnrollment?->schoolYear->year, 
                'request_data'   => $newRequestData,
                'timestamp'      => now(),
                'action'         => 'Update',
            ];

            $applicationId = $latestVersion->application_id;
            $maxVersion = ApplicationFormVersion::where('application_id', $applicationId)->max('version');
            $nextVersion = $maxVersion ? $maxVersion + 1 : 1;
            
            $userName = auth()->user()->username ?? 'system';

            $newVersion = ApplicationFormVersion::create([
                'application_id' => $latestVersion->application_id,
                'version' => $nextVersion,
                'updated_by' => $userName,
                'action' => 'update',
                'data_snapshot' => json_encode($newSnapshot, JSON_PRETTY_PRINT),
            ]);

            DB::commit();

            if ($shouldClearCache) {
                $student->refresh(); 
                StudentStatusUpdated::dispatch($student);
            }

            if (!empty($auditChanges)) {
                $this->auditTrail->log('update_student', [
                    'student_id' => $student->student_id,
                    'changes'    => $auditChanges,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Student updated and new application form version created',
                'version_id' => $newVersion->version_id,
                'data' => $newSnapshot,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'type' => 'validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('Update Student Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'type' => 'server',
                'message' => 'Failed to update student.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function getStudentHistoryDates($id)
    {
        try {
            $histories = ApplicationFormVersion::whereHas('applicationForm.enrollment', function ($q) use ($id) {
                    $q->where('id', $id);
                })
                ->with(['applicationForm.enrollment.schoolYear', 'applicationForm.enrollment'])
                ->orderBy('updated_at', 'desc')
                ->get(['version_id', 'application_id', 'updated_at']);
    
            $grouped = $histories->groupBy(function ($item) {
                return $item->applicationForm->enrollment->schoolYear->year ?? 'Unknown Year';
            });
    
            $formatted = $grouped->map(function ($items, $year) {
                return [
                    'school_year' => $year,
                    'dates' => $items->map(function ($item) {
                        return [
                            'version_id' => $item->version_id,
                            'application_id' => $item->application_id,
                            'updated_at' => $item->updated_at->format('d F H:i'),
                        ];
                    })->values(),
                ];
            })->values();
    
            return response()->json($formatted);

        } catch (\Exception $e) {
            Log::error('Get Student History Dates Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve history dates.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function getHistoryDetail($versionId)
    {
        try {
            $version = ApplicationFormVersion::with('applicationForm.enrollment.student')
                ->findOrFail($versionId);

            $student = $version->applicationForm->enrollment->student ?? null;
            return response()->json([
                'success'            => true,
                'version_id'         => $version->version_id,
                'id'                 => $version->applicationForm->enrollment->id ?? null,
                'student_id'         => $student->student_id,
                'application_form_id'=> $version->application_id,
                'updated_at'         => $version->updated_at,
                'data_snapshot'      => json_decode($version->data_snapshot, true),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'History version not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get History Detail Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function storeCardNumber(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'card_number' => 'required|string|max:50|unique:students,card_number,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed. Please check your input.',
                'errors'  => $validator->errors() 
            ], 422);
        }

        try {
            $student = Student::findOrFail($id);

            $oldCardNumber = $student->card_number;
            $student->card_number = $request->card_number;
            $student->save();

            $this->auditTrail->log('generate_id_card', [
                'student_id' => $student->student_id,
                'changes' => [
                    'card_number' => [
                        'from' => $oldCardNumber,
                        'to' => $request->card_number
                    ]
                ],
                'description' => 'ID Card number generated/updated.'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Card number saved successfully.',
                'data' => [
                    'card_number' => $student->card_number
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Store Card Number Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save card number.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
