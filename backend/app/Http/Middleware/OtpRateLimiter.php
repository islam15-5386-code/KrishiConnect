<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class OtpRateLimiter
{
    /**
     * Enforce OTP rate limiting: max 5 requests per phone per hour.
     * Uses Laravel's built-in RateLimiter backed by Redis.
     *
     * The key is hashed to avoid storing raw phone numbers in Redis.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $phone = (string) ($request->input('phone_number') ?? $request->input('phone') ?? '');
        $normalizedPhone = preg_replace('/\D+/', '', $phone) ?? '';

        if ($normalizedPhone === '') {
            return $next($request);
        }

        $key = 'otp:phone:' . hash('sha256', $normalizedPhone);
        $maxAttempts = 5;
        $decaySeconds = 3600; // 1 hour window

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => 'অনেক বেশি OTP অনুরোধ। ১ ঘণ্টা পর আবার চেষ্টা করুন।',
                'data'    => null,
                'errors'  => [
                    'retry_after_seconds' => $retryAfter,
                    'retry_after_human'   => ceil($retryAfter / 60) . ' minutes',
                ],
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        RateLimiter::hit($key, $decaySeconds);

        $response = $next($request);

        // Add rate limit headers so mobile app can display countdown
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, $maxAttempts));

        return $response;
    }
}
