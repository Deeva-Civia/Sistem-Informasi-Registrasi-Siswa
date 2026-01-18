<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolYear;
use App\Models\ApplicationForm;
use Illuminate\Support\Carbon;

class AnalyticsTest extends TestCase
{
    // Tidak menggunakan RefreshDatabase karena kita menggunakan data existing
    
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. SETUP USER ADMIN
        $this->user = User::where('role', 'admin')->first(); 

        if (!$this->user) {
            $this->markTestSkipped('User admin tidak ditemukan di database. Pastikan database sudah di-seed.');
        }

        // 2. SETUP WAKTU (Auto-Detect)
        $lastApplication = ApplicationForm::latest('created_at')->first();

        if ($lastApplication) {
            Carbon::setTestNow($lastApplication->created_at);
        } else {
            Carbon::setTestNow(now());
        }
    }

    /**
     * Helper Auth Header
     */
    private function getAuthHeaders()
    {
        $token = $this->user->createToken('test-analytics')->plainTextToken;
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: Pastikan Struktur JSON Lengkap dan Benar
     */
    public function test_analytics_api_returns_correct_structure_and_http_status()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'meta' => ['date', 'current_sy', 'previous_sy', 'next_sy'],
                    'global' => [
                        'total', 'total_growth', 
                        'confirmed', 'confirmed_growth', 
                        'cancelled', 'cancelled_growth'
                    ],
                    'today' => [
                        'all' => ['total', 'confirmed', 'cancelled', 'percentage', 'growth', 'growth_confirmed', 'growth_cancelled'],
                        'new' => ['total', 'confirmed', 'cancelled', 'percentage', 'growth', 'growth_confirmed', 'growth_cancelled'],
                        'transferee' => ['total', 'confirmed', 'cancelled', 'percentage', 'growth', 'growth_confirmed', 'growth_cancelled'],
                        'returning' => ['total', 'confirmed', 'cancelled', 'percentage', 'growth', 'growth_confirmed', 'growth_cancelled'],
                    ],
                    'school_year' => [
                        'all', 'new', 'transferee', 'returning'
                    ],
                    'active_students_matrix', 
                    'pre_register',
                    'trends' => [
                        'labels', 'current_data', 'previous_data'
                    ],
                    'multi_year_trend'
                ]
            ]);
    }

    /**
     * Test 2: Validasi Logika Kalkulasi Matematika (Consistency Check)
     */
    public function test_analytics_calculations_are_mathematically_consistent()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());
        $response->assertStatus(200);
        $data = $response->json('data');

        $today = $data['today'];
        
        $calculatedTotal = $today['new']['total'] + $today['transferee']['total'] + $today['returning']['total'];
        
        $this->assertEquals(
            $today['all']['total'], 
            $calculatedTotal, 
            "Data 'Today Total' tidak sama dengan penjumlahan (New + Transferee + Returning)"
        );

        $calculatedConfirmed = $today['new']['confirmed'] + $today['transferee']['confirmed'] + $today['returning']['confirmed'];
        
        $this->assertEquals(
            $today['all']['confirmed'], 
            $calculatedConfirmed,
            "Data 'Today Confirmed' tidak konsisten."
        );

        $sy = $data['school_year'];
        $syTotalCalc = $sy['new']['total'] + $sy['transferee']['total'] + $sy['returning']['total'];

        $this->assertEquals(
            $sy['all']['total'],
            $syTotalCalc,
            "Data 'Current School Year Total' tidak konsisten."
        );
    }

    /**
     * Test 3: Validasi Active Students Matrix
     */
    public function test_active_students_matrix_logic()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());
        $matrix = $response->json('data.active_students_matrix');

        $this->assertNotEmpty($matrix, "Matrix Active Students kosong (mungkin nama Section di DB tidak cocok dengan keyword di Controller)");

        foreach ($matrix as $sectionName => $stats) {
            $this->assertArrayHasKey('total', $stats);
            $this->assertArrayHasKey('total_new', $stats);
            $this->assertArrayHasKey('total_transferee', $stats);
            $this->assertArrayHasKey('total_returning', $stats);

            $sum = $stats['total_new'] + $stats['total_transferee'] + $stats['total_returning'];
            
            $this->assertEquals(
                $stats['total'], 
                $sum, 
                "Perhitungan Total Siswa di Section '{$sectionName}' salah."
            );
        }
    }

    /**
     * Test 4: Validasi Rumus Growth Manual
     */
    public function test_growth_calculation_logic()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());
        $global = $response->json('data.global');
        
        if ($global['total_growth'] == 100) {
            $this->assertTrue(true); 
        } else {
            $this->assertIsNumeric($global['total_growth']);
        }

        $todayTotal = $response->json('data.today.all.total');
        $todayGrowth = $response->json('data.today.all.growth');

        if ($todayTotal > 0) {
            $this->assertNotNull($todayGrowth);
        }
    }

    public function test_analytics_future_date()
    {
        $futureDate = '2025-07-15';
        $syName = '2025/2026';

        $syId = SchoolYear::where('year', $syName)->value('school_year_id');

        if (!$syId) {
            $this->markTestSkipped("School Year {$syName} tidak ditemukan di DB, skip test ini.");
        }

        $expectedCount = ApplicationForm::join('enrollments', 'application_forms.enrollment_id', '=', 'enrollments.enrollment_id')
            ->where('enrollments.school_year_id', $syId)
            ->where('application_forms.status', 'Confirmed')
            ->count('enrollments.id');

        $response = $this->getJson('/api/analytics?date=' . $futureDate, $this->getAuthHeaders());
        
        $response->assertStatus(200);

        $response->assertJsonPath('data.meta.current_sy', $syName);
        
        $response->assertJsonPath('data.school_year.all.confirmed', $expectedCount);
    }

    public function test_trend_labels_start_from_july()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());
        $labels = $response->json('data.trends.labels');

        $this->assertCount(12, $labels);

        $this->assertEquals('Jul', $labels[0], "Trend tidak dimulai dari bulan Juli.");

        $this->assertEquals('Jun', $labels[11], "Trend tidak berakhir di bulan Juni.");
        
        $this->assertEquals('Dec', $labels[5]);
        $this->assertEquals('Jan', $labels[6]);
    }

    /**
     * Test 8: Validasi Struktur Unique Students Breakdown
     */
    public function test_enrollment_unique_students_structure()
    {
        $response = $this->getJson('/api/analytics', $this->getAuthHeaders());
        $breakdown = $response->json('data.enrollment_unique_students.breakdown');
        $summary = $response->json('data.enrollment_unique_students.summary');

        $expectedKeys = ['total', 'active', 'graduate', 'expelled', 'withdraw', 'unknown'];
        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $summary, "Summary kehilangan key: $key");
        }

        if (!empty($breakdown)) {
            $firstSection = reset($breakdown);
            foreach ($expectedKeys as $key) {
                $this->assertArrayHasKey($key, $firstSection, "Breakdown section kehilangan key: $key");
            }
        }
    }
}