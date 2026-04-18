<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'phone_number' => '+8801' . fake()->unique()->numerify('#########'),
            'role' => 'farmer',
            'is_verified' => true,
            'fcm_token' => fake()->optional()->sha1(),
            'preferred_language' => fake()->randomElement(['bn', 'en']),
            'is_active' => true,
            'last_login_at' => now()->subDays(fake()->numberBetween(0, 14)),
        ];
    }

    public function farmer(): static
    {
        return $this->state(fn () => ['role' => 'farmer']);
    }

    public function officer(): static
    {
        return $this->state(fn () => ['role' => 'agricultural_officer']);
    }

    public function company(): static
    {
        return $this->state(fn () => ['role' => 'company']);
    }

    public function vendor(): static
    {
        return $this->state(fn () => ['role' => 'vendor']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }
}
