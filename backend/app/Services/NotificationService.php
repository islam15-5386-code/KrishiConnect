<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send Firebase Cloud Messaging push notification via HTTP v1 API.
     *
     * @param User   $user  Recipient user (must have fcm_token set)
     * @param string $title Notification title
     * @param string $body  Notification body text
     * @param array  $data  Extra key-value data payload for the app
     */
    public function sendPush(User $user, string $title, string $body, array $data = []): void
    {
        if (empty($user->fcm_token)) {
            Log::debug("NotificationService: No FCM token for user #{$user->id}, skipping push.");
            return;
        }

        $this->sendFcmPush((string) $user->fcm_token, $title, $body, $data);
    }

    /**
     * Send Firebase Cloud Messaging push notification via HTTP v1 API.
     */
    public function sendFcmPush(string $fcmToken, string $title, string $body, array $data = []): void
    {
        if ($fcmToken === '') {
            return;
        }

        try {
            $accessToken = $this->getFcmAccessToken();
            $projectId   = config('services.fcm.project_id');

            $payload = [
                'message' => [
                    'token'        => $fcmToken,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'data'         => array_map('strval', $data), // FCM requires string values
                    'android'      => [
                        'notification' => ['sound' => 'default'],
                        'priority'     => 'high',
                    ],
                    'apns'         => [
                        'payload' => ['aps' => ['sound' => 'default']],
                    ],
                ],
            ];

            $response = Http::withToken($accessToken)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $payload);

            if ($response->successful()) {
                Log::info('NotificationService: FCM push sent successfully.');
                return;
            }

            Log::error('NotificationService: FCM send failed.', [
                'status'   => $response->status(),
                'response' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            Log::error("NotificationService: FCM exception: {$e->getMessage()}");
        }
    }

    /**
     * Send Bangla SMS via SSL Wireless Bangladesh API.
     *
     * Supports UTF-8 Bangla text (billed as 2 SMS credits per 80 Bengali chars).
     *
     * @param string $phone   Recipient's BD phone number (e.g. 01712345678)
     * @param string $message Bangla/English SMS text
     */
    public function sendSms(string $phone, string $message): void
    {
        $phone = $this->normalizeBdPhone($phone);

        try {
            $response = Http::timeout(10)->post(config('services.ssl_wireless_sms.api_url'), [
                'user'     => config('services.ssl_wireless_sms.user'),
                'pass'     => config('services.ssl_wireless_sms.pass'),
                'sid'      => config('services.ssl_wireless_sms.sender_id'),
                'msisdn'   => $phone,
                'sms'      => $message,
                'csmsid'   => uniqid('kc_'), // Unique reference ID
            ]);

            $body = $response->body();

            // SSL Wireless returns "SUCCESS" or "1000" on success
            if (str_contains($body, 'SUCCESS') || str_contains($body, '1000')) {
                Log::info("NotificationService: SMS sent to {$phone}");
                return;
            }

            Log::warning("NotificationService: SMS failed to {$phone}: {$body}");
        } catch (\Throwable $e) {
            Log::error("NotificationService: SMS exception to {$phone}: {$e->getMessage()}");
        }
    }

    /**
     * Send bulk SMS to multiple farmers (e.g. district-wide broadcast).
     *
     * @param array  $phones  Array of phone numbers
     * @param string $message SMS text
     */
    public function sendBulkSms(array $phones, string $message): array
    {
        $results = [];
        foreach ($phones as $phone) {
            $this->sendSms($phone, $message);
            $results[$phone] = true;
        }
        return $results;
    }

    /**
     * Normalize Bangladesh phone number to international format.
     * Accepts: 01712345678, +8801712345678, 8801712345678
     */
    private function normalizeBdPhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '880')) {
            return $phone;
        }
        if (str_starts_with($phone, '0')) {
            return '880' . substr($phone, 1);
        }
        return '880' . $phone;
    }

    /**
     * Get a short-lived OAuth2 access token for FCM HTTP v1 API.
     * In production, use kreait/firebase-php for managed token refresh.
     *
     * @throws \RuntimeException
     */
    private function getFcmAccessToken(): string
    {
        $serviceAccountJson = config('services.fcm.service_account_json');

        if (empty($serviceAccountJson)) {
            throw new \RuntimeException('FCM service account JSON not configured.');
        }

        $serviceAccount = json_decode($serviceAccountJson, true);

        if (!is_array($serviceAccount)) {
            throw new \RuntimeException('Invalid FCM service account JSON format.');
        }

        if (!class_exists(\Google\Auth\Credentials\ServiceAccountCredentials::class)) {
            throw new \RuntimeException('google/auth package is required for FCM HTTP v1 OAuth2.');
        }

        // Use kreait/firebase-php Google credentials helper
        $credentials = new \Google\Auth\Credentials\ServiceAccountCredentials(
            'https://www.googleapis.com/auth/firebase.messaging',
            $serviceAccount
        );

        $token = $credentials->fetchAuthToken();
        return (string) ($token['access_token'] ?? '');
    }
}
