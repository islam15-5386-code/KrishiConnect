<?php

namespace App\Http\Controllers\API\v1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\AuditLog;
use App\Models\OtpCode;
use App\Models\User;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    // ────────────────────────────────────────
    // POST /api/v1/auth/send-otp
    // ────────────────────────────────────────

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $phone     = $request->validated('phone_number');
        $phoneHash = hash('sha256', $phone);
        $otpCode   = $this->generateOtp();
        $expiresAt = now()->addMinutes(config('app.otp_ttl_minutes', 5));

        // Invalidate any existing unused OTPs for this phone
        OtpCode::where('phone_hash', $phoneHash)
               ->where('is_used', false)
               ->update(['is_used' => true]);

        OtpCode::create([
            'phone_hash' => $phoneHash,
            'code'       => $otpCode,
            'purpose'    => $request->validated('purpose', 'login'),
            'expires_at' => $expiresAt,
            'ip_address' => $request->ip(),
        ]);

        // Send Bangla SMS OTP
        $message = "আপনার KrishiConnect OTP: {$otpCode}। মেয়াদ ৫ মিনিট। কাউকে শেয়ার করবেন না।";
        $this->notificationService->sendSms($phone, $message);

        AuditLog::logEvent('otp_sent', null, $phoneHash, ['purpose' => $request->validated('purpose', 'login')]);

        // In local/testing environment, return OTP in response for ease of testing
        $responseData = app()->isLocal() ? ['code' => $otpCode] : null;

        return $this->success($responseData, 'OTP পাঠানো হয়েছে।');
    }

    // ────────────────────────────────────────
    // POST /api/v1/auth/verify-otp
    // ────────────────────────────────────────

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone     = $request->validated('phone_number');
        $phoneHash = hash('sha256', $phone);
        $inputCode = $request->validated('code');

        $otpRecord = OtpCode::where('phone_hash', $phoneHash)
                            ->where('is_used', false)
                            ->where('expires_at', '>', now())
                            ->latest()
                            ->first();

        if (!$otpRecord) {
            AuditLog::logEvent('otp_expired', null, $phoneHash);
            return $this->error('OTP মেয়াদ উত্তীর্ণ বা বৈধ নয়। পুনরায় অনুরোধ করুন।', [], 422);
        }

        // Increment attempt counter to detect brute force
        $otpRecord->increment('attempts');

        if ($otpRecord->attempts > 3) {
            $otpRecord->update(['is_used' => true]);
            AuditLog::logEvent('otp_brute_force', null, $phoneHash);
            return $this->error('অনেক বেশি ভুল চেষ্টা। নতুন OTP অনুরোধ করুন।', [], 429);
        }

        if ($otpRecord->code !== $inputCode) {
            AuditLog::logEvent('otp_wrong', null, $phoneHash, ['attempts' => $otpRecord->attempts]);
            return $this->error('OTP সঠিক নয়।', ['remaining_attempts' => 3 - $otpRecord->attempts], 422);
        }

        // OTP verified — mark used
        $otpRecord->update(['is_used' => true]);

        // Find or create user record
        $user = User::findByPhone($phone);
        $isNewUser = false;

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'phone_number' => $phone,
                'role'         => 'farmer', // default; updated at registration
                'is_verified'  => true,
            ]);
        } else {
            $user->update(['is_verified' => true, 'last_login_at' => now()]);
        }

        // Issue 24-hour Sanctum token
        $tokenResult = $user->createApiToken('mobile');
        $token       = $tokenResult->plainTextToken;

        AuditLog::logEvent('otp_verified', $user->id, $phoneHash);
        AuditLog::logEvent('login', $user->id, $phoneHash, ['is_new_user' => $isNewUser]);

        return $this->success([
            'token'         => $token,
            'token_type'    => 'Bearer',
            'expires_in'    => config('sanctum.expiration', 1440) * 60, // seconds
            'user'          => [
                'id'                 => $user->id,
                'role'               => $user->role,
                'is_new_user'        => $isNewUser,
                'preferred_language' => $user->preferred_language,
                'profile_complete'   => $isNewUser ? false : $user->farmerProfile()->exists(),
            ],
        ], 'OTP যাচাই সফল।');
    }

    // ────────────────────────────────────────
    // POST /api/v1/auth/register
    // ────────────────────────────────────────

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($user, $data) {
            // Update role if changing from default
            if (isset($data['role'])) {
                $user->update(['role' => $data['role'], 'preferred_language' => $data['preferred_language'] ?? 'bn']);
            }

            // Create role-specific profile
            match ($user->role) {
                'farmer' => $user->farmerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'full_name'       => $data['full_name'],
                        'division'        => $data['division'],
                        'district'        => $data['district'],
                        'upazila'         => $data['upazila'],
                        'land_size_acres' => $data['land_size_acres'] ?? 0,
                        'primary_crops'   => $data['primary_crops'] ?? [],
                        'national_id'     => $data['national_id'] ?? null,
                    ]
                ),
                'agricultural_officer' => $user->officerProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'full_name'      => $data['full_name'],
                        'employee_id'    => $data['employee_id'],
                        'division'       => $data['division'],
                        'district'       => $data['district'],
                        'upazila'        => $data['upazila'] ?? null,
                        'specialization' => $data['specialization'] ?? null,
                    ]
                ),
                default => null,
            };
        });

        AuditLog::logEvent('profile_complete', $user->id);

        return $this->success([
            'user' => $user->fresh()->load(['farmerProfile', 'officerProfile']),
        ], 'প্রোফাইল সম্পন্ন হয়েছে।');
    }

    // ────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────

    private function generateOtp(): string
    {
        // Cryptographically secure 6-digit OTP
        return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }
}
