<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'event' => fake()->randomElement([
                'otp_sent',
                'otp_verified',
                'login',
                'logout',
                'token_refresh',
                'login_failed',
            ]),
            'phone_hash' => hash('sha256', '+8801' . fake()->numerify('#########')),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'metadata' => [
                'platform' => fake()->randomElement(['web', 'android', 'ios']),
                'city' => fake()->city(),
            ],
            'occurred_at' => now()->subHours(fake()->numberBetween(1, 72)),
        ];
    }
}
