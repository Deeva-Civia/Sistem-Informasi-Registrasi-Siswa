<?php

namespace App\Services;

class AiSchemaService
{
    public function getSchema()
    {
        $schema = [
            'view_registrations_mixed' => [
                'description' => 'A SPECIAL HELPER VIEW. Use this table ONLY when the user asks for a general LIST/COUNT of "Registrations", "Pendaftar", or "Applicants" (combined Active & Cancelled). Do NOT use this for deep details like Parents or Payments.',
                'columns' => ['student_id', 'full_name', 'school_year', 'section', 'grade', 'type', 'status', 'registration_date']
            ],
            'application_forms' => [
                'description' => 'Represents a registration transaction. 
                    - TRIGGER: Created ONLY when a new registration occurs (one-to-one with enrollments). 
                    - NOTE: Does NOT create new rows for data updates/edits.
                    - "status" can be "Confirmed" or "Cancelled". 
                    - "notes" contains cancellation reason (only for old students). For new and transferee students, cancellations are moved to the "cancelled_registrations" table.',
                'columns' => [
                    'application_id', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'status', 
                    'notes', 
                    'submitted_at', 
                    'created_at', 
                    'updated_at'
                ]
            ],
            'application_form_versions' => [
                'description' => 'Audit Log / Edit History WITHIN A SINGLE REGISTRATION.
                    - TRIGGER: A new row is created for EVERY new registration AND EVERY time student data is updated/edited for ONE specific enrollment period (e.g., User fixed a typo or changed address during the current semester registration).
                    - USE CASE: Use this to see "What data was changed/edited in THIS specific form?".
                    - NOT FOR: Do NOT use this to find data from "Previous Semesters" or "Last Year". For academic timeline history, use the "enrollments" table.
                    - "data_snapshot" (JSON) contains the data state at that specific version.',
                'columns' => [
                    'version_id', 
                    'application_id (Foreign Key linked to application_forms)', 
                    'version', 
                    'updated_at', 
                    'updated_by', 
                    'action', 
                    'data_snapshot (JSON)'
                ]
            ],
            'students' => [
                'description' => 'Core student data. 
                    - "id" is the primary key. 
                    - "student_id" is the school ID (MIS format). 
                    - "academic_status" values: "Regular", "Sit-in", or "Other". If "Other", the specific value is in "academic_status_other". 
                    - "active" (YES/NO) indicates if the student is currently active. 
                    - "status" values: "Not Graduate", "Withdraw", "Expelled", "Graduate". "graduated_at" is set when status becomes Graduate.
                    - IMPORTANT: "registration_date" in this table only records the FIRST time they registered in a section and gets overwritten. TO FIND THE ACCURATE REGISTRATION DATE for a specific enrollment, YOU MUST JOIN WITH THE "enrollments" TABLE and use "enrollments.registration_date".',
                'columns' => [
                    'id', 'student_id', 'studentall_id', 'nisn', 'first_name', 'middle_name', 'last_name', 
                    'nickname', 'family_rank', 'citizenship', 'country', 'nik', 'kitas', 
                    'place_of_birth', 'date_of_birth', 'age', 'gender', 'phone_number', 'email', 
                    'photo_path', 'card_number', 'previous_school', 'religion', 
                    'va_mandiri', 'va_bca', 'va_bni', 'va_bri', 
                    'active (YES/NO)', 'status', 
                    'academic_status (Regular/Sit-in/Other)', 'academic_status_other', 
                    'registration_date (WARNING: Use enrollments.registration_date instead)', 
                    'updated_at', 'graduated_at'
                ]
            ],
            'student_addresses' => [
                'description' => 'Address details for students.',
                'columns' => [
                    'student_address_id', 
                    'id (Foreign Key linked to students.id)', 
                    'enrollment_id (Foreign Key linked to enrollments.enrollment_id)', 
                    'street', 'village', 'district', 'rt', 'rw', 'city_regency', 'province', 'other'
                ]
            ],
            'enrollments' => [
                'description' => 'Academic Timeline / Registration History.
                    - SCOPE: Tracks history ACROSS TIME (Semesters/School Years).
                    - BEHAVIOR: A new row (new enrollment_id) is created for every NEW registration event (e.g., Student moves from Grade 1 to Grade 2, or Semester 1 to Semester 2).
                    - LINKING: Tables like "student_addresses", "parents", "payments" are linked to this "enrollment_id".
                    - USE CASE: Use this to find historical data like "What was the student address LAST YEAR?".
                    - "registration_id" uses the specific Manado Independent School format.
                    - "version" is a counter indicating how many times this student has registered.
                    - "registration_date" is the specific date for THIS enrollment (a new row/enrollment is created for every registration event).
                    - "student_status" values: "Old", "New" (means the student is new to this specific section), or "Transferee".
                    - "status" values: "Active" (indicates the enrollment is for the CURRENT ongoing school year) or "Inactive" (indicates the enrollment is for a past or future school year).
                    - "school_year_id" determines the academic year for this enrollment.',
                'columns' => [
                    'enrollment_id', 
                    'id (Foreign Key linked to students.id)', 
                    'registration_id', 
                    'version', 
                    'registration_date', 
                    'class_id (Foreign Key linked to classes)', 
                    'section_id (Foreign Key linked to sections)', 
                    'major_id (Foreign Key linked to majors)', 
                    'semester_id (Foreign Key linked to semesters)', 
                    'school_year_id (Foreign Key linked to school_years)', 
                    'program_id (Foreign Key linked to programs)', 
                    'residence_id (Foreign Key linked to residence_halls)', 
                    'transport_id (Foreign Key linked to transportations)', 
                    'pickup_point_id (Foreign Key linked to pickup_points)', 
                    'student_status (Old/New/Transferee)', 
                    'residence_hall_policy', 'transportation_policy', 
                    'status (Active/Inactive)'
                ]
            ],
            'parents' => [
                'description' => 'Parental information (Father and Mother details).',
                'columns' => [
                    'parent_id', 
                    'id (Foreign Key linked to students.id)', 
                    'enrollment_id (Foreign Key linked to enrollments.enrollment_id)', 
                    'father_name', 'father_occupation', 'father_company', 'father_phone', 'father_email', 
                    'mother_name', 'mother_occupation', 'mother_company', 'mother_phone', 'mother_email'
                ]
            ],
            'father_addresses' => [
                'description' => 'Address details specific to the father.',
                'columns' => [
                    'father_address_id', 
                    'parent_id (Foreign Key linked to parents)', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'street', 'village', 'district', 'rt', 'rw', 'city_regency', 'province', 'other'
                ]
            ],
            'mother_addresses' => [
                'description' => 'Address details specific to the mother.',
                'columns' => [
                    'mother_address_id', 
                    'parent_id (Foreign Key linked to parents)', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'street', 'village', 'district', 'rt', 'rw', 'city_regency', 'province', 'other'
                ]
            ],
            'guardians' => [
                'description' => 'Master data for guardians.',
                'columns' => [
                    'guardian_id', 'guardian_name', 'relation_to_student', 'phone_number', 'guardian_email'
                ]
            ],
            'student_guardians' => [
                'description' => 'Pivot/Link table connecting Students, Enrollments, and Guardians.',
                'columns' => [
                    'student_guardian_id', 
                    'id (Foreign Key linked to students.id)', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'guardian_id (Foreign Key linked to guardians)'
                ]
            ],
            'guardian_addresses' => [
                'description' => 'Address details specific to the guardian.',
                'columns' => [
                    'guardian_address_id', 
                    'guardian_id (Foreign Key linked to guardians)', 
                    'street', 'village', 'district', 'rt', 'rw', 'city_regency', 'province', 'other'
                ]
            ],
            'payments' => [
                'description' => 'Financial records for tuition and residence fees.',
                'columns' => [
                    'payment_id', 
                    'id (Foreign Key linked to students.id)', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'tuition_fees', 'residence_payment', 'financial_policy_contract'
                ]
            ],
            'student_discounts' => [
                'description' => 'Discounts applied to a student enrollment.',
                'columns' => [
                    'student_discount_id', 
                    'enrollment_id (Foreign Key linked to enrollments)', 
                    'discount_type_id (Foreign Key linked to disount_types)', 
                    'notes'
                ]
            ],
            'cancelled_registrations' => [
                'description' => "Archive for registrations cancelled by NEW students ('Withdraw') or due to 'Invalid Data'.
                    Logic & Behavior:
                    1. Scope (Withdraw): Applies only if student_status is 'NEW' and 'TRANSFEREE'. This action hard-deletes data from operational tables (enrollment, etc.) and moves it here. 
                    - Note: Old student cancellations do NOT go here; they remain in 'application_forms' with status 'cancelled'/'withdraw'.
                    2. Scope (Invalid Data): Purely for data entry errors on the registration form.
                    3. Reporting: To count actual cancellations, query ONLY where reason = 'Withdraw'.
                    4. ID Recycling: 'is_use_student_id' allows the system to reuse the student_id for a new registrant in the same Section/School Year to prevent ID gaps.
                    5. Timestamps: 'updated_at' specifically tracks WHEN the student_id was reused (is_use_student_id became true).",
                
                'columns' => [
                    'cancelled_registration_id', 
                    'school_year_id', 
                    'section_id', 
                    'student_id', 'full_name', 'registration_id', 'registration_date', 
                    'cancelled_at', 'cancelled_by', 'reason (Withdraw/Invalid data)', 'notes', 
                    'is_use_student_id', 'student_status', 'created_at', 'updated_at'
                ]
            ],
             // --- MASTER DATA TABLES ---

            'classes' => [
                'description' => 'Master data for Classes/Grades. Available grades: N, K1, K2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12.',
                'columns' => ['class_id', 'grade']
            ],
            'discount_types' => [
                'description' => 'Master data for Discount names. Available values: Beasiswa, Special Discount, Staff, Waiver, IP.',
                'columns' => ['discount_type_id', 'name']
            ],
            'majors' => [
                'description' => 'Master data for Majors (Jurusan). Available values: NO MAJOR, SOCIAL, SCIENCE.',
                'columns' => ['major_id', 'name']
            ],
            'pickup_points' => [
                'description' => 'Master data for transportation Pickup Points. Contains location names (e.g., Airmadidi, Bitung, Malalayang, dll).',
                'columns' => ['pickup_point_id', 'name']
            ],
            'programs' => [
                'description' => 'Master data for Programs. Available values: UAN, A Beka, Cambrige, Oxford, Other.',
                'columns' => ['program_id', 'name']
            ],
            'residence_halls' => [
                'description' => 'Master data for Residence Halls. Available values: Boys dormitory, Girls dormitory, Non-Residence hall.',
                'columns' => ['residence_id', 'type']
            ],
            'school_years' => [
                'description' => 'Master data for School Years. Contains dynamic academic year strings in the format "YYYY/YYYY" (Example: "2025/2026", "2030/2031"). Extract the exact year format from the user prompt to filter.',
                'columns' => ['school_year_id', 'year']
            ],
            'sections' => [
                'description' => 'Master data for educational Sections. Available values: ECP, Elementary School, Middle School, High School.',
                'columns' => ['section_id', 'name']
            ],
            'semesters' => [
                'description' => 'Master data for Semesters.  Available values: One (1), Two (2).',
                'columns' => ['semester_id', 'name', 'number']
            ],
            'transportations' => [
                'description' => 'Master data for Transportation types. Available values: Own Car, School Bus.',
                'columns' => ['transport_id', 'type']
            ],
        ];

        return json_encode($schema, JSON_PRETTY_PRINT);
    }
}