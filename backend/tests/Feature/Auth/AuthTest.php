<?php

namespace Tests\Feature\Auth;

use App\Models\OtpCode;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Mock NotificationService to avoid real SMS/FCM calls in tests
        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('sendSms')->andReturn(true);
            $mock->shouldReceive('sendPush')->andReturn(true);
        });
    }

    // ─── Send OTP ────────────────────────────────────────────────────────

    public function test_send_otp_with_valid_bangladeshi_number(): void
    {
        $response = $this->postJson('/api/v1/auth/send-otp', [
            'phone_number' => '01712345678',
        ]);

        $response->assertCreated()
                 ->assertJsonStructure(['success', 'data', 'message', 'errors'])
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('otp_codes', [
            'phone_hash' => hash('sha256', '01712345678'),
            'is_used'    => false,
        ]);
    }

    public function test_send_otp_rejects_invalid_number(): void
    {
        $response = $this->postJson('/api/v1/auth/send-otp', [
            'phone_number' => '12345',
        ]);

        $response->assertUnprocessable()
                 ->assertJson(['success' => false]);
    }

    public function test_otp_rate_limit_after_5_requests(): void
    {
        // Exhaust rate limit
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/send-otp', ['phone_number' => '01712345678']);
        }

        $response = $this->postJson('/api/v1/auth/send-otp', [
            'phone_number' => '01712345678',
        ]);

        $response->assertStatus(429);
    }

    // ─── Verify OTP ──────────────────────────────────────────────────────

    public function test_verify_valid_otp_returns_sanctum_token(): void
    {
        $phone     = '01712345678';
        $phoneHash = hash('sha256', $phone);
        $code      = '123456';

        OtpCode::create([
            'phone_hash' => $phoneHash,
            'code'       => $code,
            'purpose'    => 'login',
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone_number' => $phone,
            'code'         => $code,
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['success', 'data' => ['token', 'token_type', 'expires_in', 'user']])
                 ->assertJson(['success' => true, 'data' => ['token_type' => 'Bearer']]);

        $this->assertDatabaseHas('users', ['phone_hash' => $phoneHash]);
        $this->assertDatabaseHas('otp_codes', ['phone_hash' => $phoneHash, 'is_used' => true]);
    }

    public function test_verify_expired_otp_fails(): void
    {
        $phone = '01712345678';
        OtpCode::create([
            'phone_hash' => hash('sha256', $phone),
            'code'       => '999999',
            'purpose'    => 'login',
            'expires_at' => now()->subMinutes(1), // already expired
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone_number' => $phone,
            'code'         => '999999',
        ]);

        $response->assertUnprocessable()->assertJson(['success' => false]);
    }

    public function test_verify_wrong_otp_increments_attempts(): void
    {
        $phone = '01712345678';
        $otp   = OtpCode::create([
            'phone_hash' => hash('sha256', $phone),
            'code'       => '123456',
            'purpose'    => 'login',
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/v1/auth/verify-otp', ['phone_number' => $phone, 'code' => '000000']);
        $this->assertEquals(1, $otp->fresh()->attempts);
    }

    // ─── Register ────────────────────────────────────────────────────────

    public function test_register_farmer_profile(): void
    {
        $user  = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        $token = $user->createApiToken()->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/auth/register', [
            'full_name'       => 'রহিম উদ্দিন',
            'division'        => 'ঢাকা',
            'district'        => 'ময়মনসিংহ',
            'upazila'         => 'ত্রিশাল',
            'land_size_acres' => 2.5,
            'primary_crops'   => ['ধান', 'পাট'],
        ]);

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseHas('farmer_profiles', [
            'user_id'   => $user->id,
            'full_name' => 'রহিম উদ্দিন',
            'district'  => 'ময়মনসিংহ',
        ]);
    }
}
