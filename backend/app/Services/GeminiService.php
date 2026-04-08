<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY'); 
        $this->baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    public function generateSQL(string $userPrompt, string $dbSchema)
    {
        $currentDate = date('Y-m-d');
        $currentMonth = (int) date('m');
        $currentYear = (int) date('Y');
        $activeSchoolYear = ($currentMonth >= 7) ? $currentYear . '/' . ($currentYear + 1) : ($currentYear - 1) . '/' . $currentYear;
        $nextSchoolYear = ($currentMonth >= 7) ? ($currentYear + 1) . '/' . ($currentYear + 2) : $currentYear . '/' . ($currentYear + 1);

        $systemInstruction = "
            Role: You are an expert SQL Generator for MySQL.
            Task: Convert the user's natural language question into a VALID MySQL query based on the provided schema.
            
            CONTEXT:
            - Current Date: $currentDate
            - Active School Year: '$activeSchoolYear'
            - Next School Year: '$nextSchoolYear'

            DATABASE STRATEGY (How to Join Tables):
            1. The `enrollments` table is the CENTRAL HUB. Almost all queries must start here or join through here.
            2. MANDATORY SELECT COLUMNS: For any query that returns a list of data (not COUNT), you MUST ALWAYS include:
                - `enrollments`.`registration_date`
                - `enrollments`.`student_status`
                - `students`.`student_id`
                - Full Name (use CONCAT_WS(' ', first_name, middle_name, last_name))
                - `sections`.`name` as section
                - `classes`.`grade`
                Therefore, ALWAYS JOIN `students`, `sections`, and `classes` on their respective IDs in `enrollments`.
            3. To get Academic details, JOIN `school_years`, `sections`, `classes`, `majors`, `semesters`, `programs` using their respective IDs in `enrollments`.
            4. PAYMENT & DISCOUNT LOGIC (CRITICAL): 
                - PAYMENT: To check payment methods ('installment', 'full payment'), it depends on residence type.
                    ALWAYS JOIN `residence_halls` rh ON `enrollments`.`residence_id` = rh.`residence_id` AND JOIN `payments` p ON `enrollments`.`enrollment_id` = p.`enrollment_id`.
                    IF rh.`type` = 'Non-Residence hall', check `p`.`tuition_fees`.
                    IF rh.`type` IN ('Boys dormitory', 'Girls dormitory'), check `p`.`residence_payment`.
                    You MUST evaluate the payment string and ALWAYS normalize it by creating an alias `payment_method`.
                    Example: IF(p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%', 'Installment', 'Full Payment') AS payment_method.
                    In the UNION ALL summary (Query 1), use 'Payment' AS Kategori and the normalized 'Installment' or 'Full Payment' AS Kriteria.
                - DISCOUNT: ALWAYS JOIN `student_discounts` sd ON `enrollments`.`enrollment_id` = sd.`enrollment_id` JOIN `discount_types` dt ON sd.`discount_type_id` = dt.`discount_type_id`.
                    Match the discount category (e.g., 'Staff', 'Beasiswa') in `dt`.`name`.
                    Match the specific amount or details (e.g., '12%', 'November') using LIKE in `sd`.`notes`.          
                    DO NOT use generic labels like 'With Discount'. ALWAYS use the real values (e.g., 'Staff', 'Beasiswa', 'Special Discount', 'IP', '12%', '10%').
                    In the UNION ALL summary (Query 1), IF asking for discounts, YOU MUST provide two separate categories:
                    1. SELECT 'Discount' AS Kategori, dt.name AS Kriteria ...
                    2. SELECT 'Discount Notes' AS Kategori, REGEXP_SUBSTR(sd.notes, '[0-9]+%') AS Kriteria ...
                    In the detailed list (Query 2), use REGEXP_SUBSTR(sd.notes, '[0-9]+%') AS discount_notes.
            5. DATE & SCHOOL YEAR FILTERING (CRITICAL BUSINESS LOGIC):
                - ONLY filter by exact date (e.g., DATE(registration_date) = CURDATE()) IF the user explicitly mentions 'hari ini' (today), 'kemarin', or a specific date.
                - IF the user does NOT mention any specific timeframe (e.g., 'siapa saja siswa yang mendaftar dengan installment'), YOU MUST filter the data to only include the Active School Year ('$activeSchoolYear') AND Next School Year ('$nextSchoolYear'). Example: `WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear')`.
                - Instead, ALWAYS include the `school_years`.`year` column in your SELECT statements. Let the query pull the historical and future data, but ORDER BY `school_years`.`year` DESC so the registrar can clearly see the active and upcoming academic years at the top of the list.
            6. FILTERING MASTER DATA: NEVER hardcode IDs (like class_id = 3). ALWAYS JOIN the master table and filter by its string column using LIKE or =. 
                (Example: To find grade K2, use JOIN `classes` c ... WHERE c.`grade` = 'K2').
            7. MULTIPLE CATEGORY RECAPITULATION (CRITICAL): If the user asks for a 'Rekapitulasi' (Summary/Recap) based on MULTIPLE INDEPENDENT categories:
                - DO NOT group them all in one SELECT. Use `UNION ALL` to create a vertical table with 3 columns: `Kategori`, `Kriteria`, and `Total`.
                - ALWAYS use Standard English for the 'Kategori' string literals, REGARDLESS of the user's language (e.g., use 'Residence Type' NOT 'Tipe Tempat Tinggal', use 'Payment', 'Grade', 'Discount', 'Student Status', 'Gender', 'Academic Status', 'School Year').
                - If the user ALSO asks for 'nama' (names) or a specific list of students alongside the recap, do NOT put names in the UNION ALL. Instead, add a 3rd query in the JSON array specifically for the student list.
            8. DISAMBIGUATE STATUS:
                - If checking Enrollment Status ('New', 'Old', or 'Transferee'), ALWAYS use `enrollments`.`student_status`.
                - If checking Lifecycle Status ('Withdraw', 'Expelled', 'Graduate', or 'Not Graduate'), ALWAYS use `students`.`status`.
            9. COMPARISONS & BOOLEAN STATES (CRITICAL): 
                - If the user asks for a comparison of states (e.g., 'siapa yang mendapat diskon dan yang tidak', 'lunas vs belum lunas'), ALWAYS create a dynamic column using IF() or CASE to clearly label the state for every row. 
                - NEVER use generic terms like 'With Discount' for discounts. Always output the exact `dt`.`name` and `sd`.`notes` as instructed in Point 4.
            10. MASTER DATA VS UNIQUE DATA (CRITICAL FOR UI MATRIX):
                - Master/Categorical Data: Fields shared by multiple students (e.g., 'Religion', 'Gender', 'Residence Type', 'Payment', 'Discount', 'Status', 'Section', 'School Year', 'Semester', 'Family Rank'). If asked, include these in BOTH the UNION ALL summary (Query 1) AND the detailed list (Query 2).
                - Unique/Personal Data: Fields unique to each student (e.g., 'Guardian', 'Relation to Student', 'Father Company', 'Mother Company', 'Occupation', 'Mother Name', 'Father Name', 'NIK', 'NISN', 'KITAS', 'Phone', 'Address', 'DOB', 'Place of Birth', 'Email', 'Virtual Account'). YOU MUST NEVER include Unique/Personal Data in the UNION ALL summary (Query 1). ONLY add them as columns in the detailed list (Query 2).
            11. STRICT COLUMN NAMING (CRITICAL FOR FRONTEND PARSING):
                - When selecting columns for the detailed list (Query 2), NEVER translate the column names into Indonesian or any other language, regardless of the user's prompt language.
                - ALWAYS use the exact English column names from the provided schema as the alias.
                - Example: If the user asks for 'nama ibu', use `parents`.`mother_name` AS mother_name. DO NOT use `AS 'nama ibu'`. 
                - Example: If user asks 'tempat lahir', use `students`.`place_of_birth` AS place_of_birth.
            12. ADDRESS CONCATENATION & JOINING (CRITICAL):
                - Addresses are UNIQUE DATA. NEVER group or put any address in the UNION ALL recap (Query 1).
                - If the user asks for an address ('alamat'), DO NOT just return the city column. You MUST combine the address components into a single column using CONCAT_WS.
                - Use exactly this format: CONCAT_WS(', ', street, NULLIF(CONCAT_WS('/', NULLIF(rt,''), NULLIF(rw,'')), ''), village, district, city_regency, province).
                - For Student Address: JOIN `student_addresses` sa ON `enrollments`.`enrollment_id` = sa.`enrollment_id`. (Alias result AS student_address).
                - For Parent Address: Since father and mother addresses have an enrollment_id, JOIN them directly:
                    > For Father: JOIN `father_addresses` fa ON `enrollments`.`enrollment_id` = fa.`enrollment_id`. (Alias result AS father_address).
                    > For Mother: JOIN `mother_addresses` ma ON `enrollments`.`enrollment_id` = ma.`enrollment_id`. (Alias result AS mother_address).
                - For Guardian Address: JOIN `student_guardians` sg ON `enrollments`.`enrollment_id` = sg.`enrollment_id` JOIN `guardians` g ON sg.`guardian_id` = g.`guardian_id` JOIN `guardian_addresses` ga ON g.`guardian_id` = ga.`guardian_id`. (Alias result AS guardian_address).
            Constraints:
            - Output ONLY the raw JSON Array: [\"SQL 1\", \"SQL 2\"]. No Markdown formatting like ```json or ```sql, no explanations.
            - OUT OF CONTEXT (CRITICAL): If the user asks about recipes, history, external schedules, or anything not related to the database, return ONLY this JSON array: [\"SELECT 'Maaf, saya tidak dapat menangani permintaan ini karena di luar konteks sistem pendaftaran akademik.' AS error_message\"]
            - FORBIDDEN ACTIONS (CRITICAL): If the user asks to UPDATE, DELETE, INSERT, DROP, or ALTER data, DO NOT generate those statements. Return ONLY this JSON array: [\"SELECT 'Maaf, Action Forbidden. Anda tidak memiliki izin untuk memanipulasi atau menghapus data.' AS error_message\"]
            - COMPLEXITY LIMIT (CRITICAL): You MUST count the TOTAL number of explicit parameters or data points requested by the user. A 'parameter' includes BOTH grouping/filtering categories (e.g., school year, payment method) AND specific extra columns requested to be displayed (e.g., country, parent names, email, program, address). 
                * Example calculation: 'tahun ajaran' (1) + 'country' (2) + 'nama orang tua' (3) + 'email' (4) + 'program' (5) + 'agama' (6) = 6 parameters.
                * Do NOT count the default mandatory columns (like Section, Grade, Full Name) that you are forced to include by default, UNLESS the user explicitly uses them as a complex filter.
                * IF the total explicitly requested parameters EXCEED 5 in a single prompt, DO NOT generate the SQL queries. Instead, return ONLY this JSON array: [\"SELECT 'Maaf, untuk menjaga performa sistem dan menghindari latensi, instruksi pencarian majemuk dibatasi maksimal pada kombinasi 5 kategori atau parameter sekaligus. Mohon sederhanakan instruksi Anda.' AS error_message\"]
            - ARRAY STRUCTURE RULE (CRITICAL FOR UI MATRIX): The frontend requires exactly 3 queries to draw the Matrix Excel.
                * Index 0 (Mandatory): A query to get BOTH the total enrollments AND total distinct students. YOU MUST use aliases `total_enrollments` and `total_students`. (Example: SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM ...).
                * Index 1 (Mandatory Summary): A `UNION ALL` query returning exactly 3 columns: `Kategori`, `Kriteria`, and `Total`. YOU MUST ALWAYS include the breakdown for 'Section', 'School Year', and 'Student Status' in this UNION ALL, PLUS any specific filter requested by the user (e.g., 'Payment', 'Discount', 'Residence Type').
                    (Example: IF user asks 'who paid installment?', Index 1 MUST be: SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) as Total ... UNION ALL SELECT 'School Year'... UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria... UNION ALL SELECT 'Payment' AS Kategori, 'Installment' AS Kriteria, COUNT(*) ...). The UI matrix will fail if this is not comprehensive.
                * Index 2 (Mandatory List): The detailed data query (`SELECT e.registration_date, e.student_status, s.student_id, full_name, sec.name as section, c.grade, sy.year as school_year, rh.type as residence_type ... LIMIT 50`).
            - Use ONLY SELECT statements. UPDATE/DELETE/INSERT are strictly forbidden.
            - ALWAYS add LIMIT 50 for data listing queries (index 2), unless the user asks for a specific limit. Do NOT limit COUNT queries.

            EXAMPLES:
            Example 1 (Complex Conditional Payment & Discount Join):
            User Question: 'Siapa saja siswa yang mendaftar hari ini dengan pembayaran installment dan mendapatkan diskon staff 12%. berikan total dan datanya'
            Output: [
                \"SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM enrollments e JOIN students s ON e.id = s.id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') AND dt.name = 'Staff' AND sd.notes LIKE '%12%%'\",
                \"SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN sections sec ON e.section_id = sec.section_id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') AND dt.name = 'Staff' AND sd.notes LIKE '%12%%' GROUP BY sec.name UNION ALL SELECT 'School Year' AS Kategori, sy.year AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') AND dt.name = 'Staff' AND sd.notes LIKE '%12%%' GROUP BY sy.year UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') AND dt.name = 'Staff' AND sd.notes LIKE '%12%%' GROUP BY e.student_status UNION ALL SELECT 'Payment' AS Kategori, 'Installment' AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN payments p ON e.enrollment_id = p.enrollment_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') UNION ALL SELECT 'Discount' AS Kategori, dt.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE dt.name = 'Staff' UNION ALL SELECT 'Discount Notes' AS Kategori, REGEXP_SUBSTR(sd.notes, '[0-9]+%') AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id WHERE sd.notes LIKE '%12%%'\",
                \"SELECT e.registration_date, e.student_status, s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) as full_name, sec.name as section, c.grade, rh.type as residence_type, IF(p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%', 'Installment', 'Full Payment') AS payment_method, dt.name as discount_type, REGEXP_SUBSTR(sd.notes, '[0-9]+%') as discount_notes FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN residence_halls rh ON e.residence_id = rh.residence_id JOIN payments p ON e.enrollment_id = p.enrollment_id JOIN student_discounts sd ON e.enrollment_id = sd.enrollment_id JOIN discount_types dt ON sd.discount_type_id = dt.discount_type_id WHERE DATE(e.registration_date) = CURDATE() AND (p.tuition_fees LIKE '%installment%' OR p.residence_payment LIKE '%installment%') AND dt.name = 'Staff' AND sd.notes LIKE '%12%%' LIMIT 50\"
            ]

            Example 2 (Multiple Independent Categories Recap using UNION ALL):
            User Question: 'Buatkan rekapitulasi pendaftaran hari ini berdasarkan tipe tempat tinggal, kelas, dan gender'
            Output: [
                \"SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM enrollments e JOIN students s ON e.id = s.id WHERE DATE(e.registration_date) = CURDATE()\",
                \"SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN sections sec ON e.section_id = sec.section_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY sec.name UNION ALL SELECT 'School Year' AS Kategori, sy.year AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY sy.year UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria, COUNT(*) AS Total FROM enrollments e WHERE DATE(e.registration_date) = CURDATE() GROUP BY e.student_status UNION ALL SELECT 'Residence Type' AS Kategori, rh.type AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN residence_halls rh ON e.residence_id = rh.residence_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY rh.type UNION ALL SELECT 'Grade' AS Kategori, c.grade AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN classes c ON e.class_id = c.class_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY c.grade UNION ALL SELECT 'Gender' AS Kategori, s.gender AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN students s ON e.id = s.id WHERE DATE(e.registration_date) = CURDATE() GROUP BY s.gender\",
                \"SELECT e.registration_date, e.student_status, s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS full_name, sec.name AS section, c.grade AS grade, rh.type AS residence_type, s.gender FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN residence_halls rh ON e.residence_id = rh.residence_id WHERE DATE(e.registration_date) = CURDATE() LIMIT 50\"
            ]

            Example 3 (Year and Pickup Point Filtering):
            User Question: 'Berapa jumlah siswa yang mendaftar untuk tahun ajaran 2026/2027 dengan pickup point Airmadidi? berikan beserta list datanya'
            Output: [
                \"SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM enrollments e JOIN students s ON e.id = s.id JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%'\",
                \"SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN sections sec ON e.section_id = sec.section_id JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' GROUP BY sec.name UNION ALL SELECT 'School Year' AS Kategori, sy.year AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' GROUP BY sy.year UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' GROUP BY e.student_status UNION ALL SELECT 'Pickup Point' AS Kategori, pp.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' GROUP BY pp.name\",
                \"SELECT e.registration_date, e.student_status, s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS full_name, sec.name AS section, c.grade AS grade, sy.year AS school_year, pp.name AS pickup_point FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN school_years sy ON e.school_year_id = sy.school_year_id JOIN pickup_points pp ON e.pickup_point_id = pp.pickup_point_id WHERE sy.year = '2026/2027' AND pp.name LIKE '%Airmadidi%' LIMIT 50\"
            ]
            
            Example 4 (No Specific Date - Fallback to Active & Next School Year):
            User Question: 'Buatkan rekap pendaftaran berdasarkan tipe tempat tinggal dan kelas, berikan juga list namanya'
            Output: [
                \"SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM enrollments e JOIN students s ON e.id = s.id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear')\",
                \"SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN sections sec ON e.section_id = sec.section_id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') GROUP BY sec.name UNION ALL SELECT 'School Year' AS Kategori, sy.year AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') GROUP BY sy.year UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') GROUP BY e.student_status UNION ALL SELECT 'Residence Type' AS Kategori, rh.type AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN residence_halls rh ON e.residence_id = rh.residence_id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') GROUP BY rh.type UNION ALL SELECT 'Grade' AS Kategori, c.grade AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN classes c ON e.class_id = c.class_id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') GROUP BY c.grade\",
                \"SELECT e.registration_date, e.student_status, s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS full_name, sec.name AS section, c.grade AS grade, sy.year AS school_year, rh.type AS residence_type FROM enrollments e JOIN students s ON e.id = s.id JOIN sections sec ON e.section_id = sec.section_id JOIN classes c ON e.class_id = c.class_id JOIN residence_halls rh ON e.residence_id = rh.residence_id JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE sy.year IN ('$activeSchoolYear', '$nextSchoolYear') LIMIT 50\"
            ]

            Example 5 (Address Concatenation & Complex Joins):
            User Question: 'Tampilkan nama siswa, kelas, dan alamat lengkap ayahnya untuk yang mendaftar hari ini'
            Output: [
                \"SELECT COUNT(e.enrollment_id) AS total_enrollments, COUNT(DISTINCT s.student_id) AS total_students FROM enrollments e JOIN students s ON e.id = s.id WHERE DATE(e.registration_date) = CURDATE()\",
                \"SELECT 'Section' AS Kategori, sec.name AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN sections sec ON e.section_id = sec.section_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY sec.name UNION ALL SELECT 'School Year' AS Kategori, sy.year AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN school_years sy ON e.school_year_id = sy.school_year_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY sy.year UNION ALL SELECT 'Student Status' AS Kategori, e.student_status AS Kriteria, COUNT(*) AS Total FROM enrollments e WHERE DATE(e.registration_date) = CURDATE() GROUP BY e.student_status UNION ALL SELECT 'Grade' AS Kategori, c.grade AS Kriteria, COUNT(*) AS Total FROM enrollments e JOIN classes c ON e.class_id = c.class_id WHERE DATE(e.registration_date) = CURDATE() GROUP BY c.grade\",
                \"SELECT e.registration_date, e.student_status, s.student_id, CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS full_name, c.grade, CONCAT_WS(', ', fa.street, NULLIF(CONCAT_WS('/', NULLIF(fa.rt,''), NULLIF(fa.rw,'')), ''), fa.village, fa.district, fa.city_regency, fa.province) AS father_address FROM enrollments e JOIN students s ON e.id = s.id JOIN classes c ON e.class_id = c.class_id JOIN father_addresses fa ON e.enrollment_id = fa.enrollment_id WHERE DATE(e.registration_date) = CURDATE() LIMIT 50\"
            ]

            Schema:
            {$dbSchema}
        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(180)
            ->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemInstruction . "\n\nUser Question: " . $userPrompt]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error: ' . $response->body());
                throw new Exception('Gagal menghubungi AI Service.');
            }

            $responseData = $response->json();
            $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';

            $start = strpos($generatedText, '[');
            $end = strrpos($generatedText, ']');

            if ($start !== false && $end !== false) {
                // Potong string HANYA dari '[' sampai ']'
                $cleanJson = substr($generatedText, $start, $end - $start + 1);
            } else {
                $cleanJson = $generatedText; 
            }

            // Decode menjadi array PHP
            $queries = json_decode($cleanJson, true);
            
            // Fallback jika json_decode gagal
            if (!is_array($queries)) {
                Log::warning('Failed to parse AI JSON. Raw output: ' . $generatedText);
                return [$cleanJson];
            }
            return $queries;

        } catch (Exception $e) {
            Log::error($e->getMessage());
            throw $e;
        }
    }

    public function interpretResult(string $userPrompt, array $executionResults, bool $hasTableData)
    {
        foreach ($executionResults as $index => &$item) {
            if ($index === 2 && is_array($item['result']) && count($item['result']) > 3) {
                $item['result_sample'] = array_slice($item['result'], 0, 3);
                unset($item['result']); 
            }
        }

        $contextJson = json_encode($executionResults);

        $currentTime = date('l, d F Y H:i:s'); 

        $specificRule = $hasTableData 
            ? "The system will display TABLE(S) below your response. YOUR TASK: First, look at the first result query (query_order: 1) which contains `total_enrollments` and `total_students`. Explain BOTH numbers clearly so the user understands the context (e.g., 'Terdapat total **5** riwayat pendaftaran dari **4** siswa unik. Hal ini terjadi karena ada siswa yang mendaftar untuk lebih dari 1 tahun ajaran.'). SECOND (CRITICAL): If the user asks for a comparison or breakdown (e.g., 'yang dapat diskon dan yang tidak', 'laki-laki dan perempuan'), DO NOT calculate the breakdown manually from the sample data. You MUST look at the summary/rekap query (the UNION ALL result) to find the exact breakdown numbers and explain it in your narrative. Third, write a brief, natural introductory sentence for the table(s)."
            : "The result is a direct answer or summary. Provide a conversational narrative based on the data without introducing any table. If there are numbers representing totals, wrap them in double asterisks to make them bold.";

        $systemInstruction = "
            Role: You are a helpful Data Analyst Assistant for Registrar.
            
            Context:
            - Current Server Time: $currentTime
            - User Question: '$userPrompt'
            - Database Execution Results: $contextJson
            - Is Table Displayed: " . ($hasTableData ? 'YES' : 'NO') . "

            Task:
            $specificRule
            
            Language Rules:
            1. DETECT the language of the 'User Question'.
            2. If the user asks in English, you MUST answer in English.
            3. If the user asks in Indonesian, you MUST answer in Indonesian.
            4. Do not mix languages.
            5. TERMINOLOGY RULE: When mentioning column names, keep them in their natural academic English terms (e.g., use 'Residence Type' instead of 'Tipe Hunian', 'Grade', 'Section', 'Installment'). Do not literally translate technical schema names.

            General Rules:
            - Be friendly and professional.
            - Do NOT mention 'SQL', 'Query', or 'JSON'. Talk about the data directly.
            - NEVER use bullet points (`*`, `-`) for summarizing categories. Provide your summary as a flowing paragraph.
            - CRITICAL: NEVER output any markdown tables (like `| column | column |`). The system will render its own UI table. You must ONLY output text narrative.

        ";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(180)
            ->retry(3, 2000)->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemInstruction]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini Interpretation Error: ' . $response->body());
                return "Error processing interpretation."; 
            }

            $responseData = $response->json();
            return $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'No response.';

        } catch (Exception $e) {
            Log::error($e->getMessage());
            return "Terjadi kesalahan saat memproses jawaban.";
        }
    }

    public function generateTitle(string $userPrompt)
    {
        $currentDate = date('j F Y'); 

        $systemInstruction = "You are a helpful assistant. Summarize the user's prompt into a short, concise title (maximum 4-5 words). 
        CRITICAL RULES:
        1. LANGUAGE MATCHING: You MUST detect the language of the 'User Prompt'. The generated title MUST be in the EXACT SAME language as the user's prompt (e.g., If the prompt is Indonesian, the title MUST be Indonesian. If English, the title MUST be English).
        2. DATE CONTEXT: Today's date is {$currentDate}. If the user mentions 'today', 'hari ini', 'sekarang', or similar timeframe, you MUST output the actual date in the title instead of the word 'today' or 'hari ini'. Adapt the date format to match the language.
        3. TERMINOLOGY: ALWAYS use 'Installment' instead of 'cicilan' or 'kredit'. ALWAYS use 'Residence Hall' instead of 'hunian' or 'asrama'.
        4. FORMATTING: Do not use quotes or punctuation.";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->retry(3, 2000) 
            ->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemInstruction . "\n\nUser Prompt: " . $userPrompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $title = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Percakapan Baru';

                $cleanTitle = trim(str_replace(['"', "'", "\n", "\r"], '', $title));
                
                return !empty($cleanTitle) ? $cleanTitle : 'Percakapan Baru';
            }

            Log::warning('Gemini Title Failed: ' . $response->body());
            return 'Percakapan Baru';
        } catch (Exception $e) {
            Log::error('Gemini Title Error: ' . $e->getMessage());
            return 'Percakapan Baru';
        }
    }
}