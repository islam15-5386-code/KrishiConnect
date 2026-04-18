<?php

namespace Database\Factories;

use App\Models\AdvisoryTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdvisoryTicket>
 */
class AdvisoryTicketFactory extends Factory
{
    protected $model = AdvisoryTicket::class;

    public function definition(): array
    {
        return [
            'farmer_id' => User::factory()->farmer(),
            'assigned_officer_id' => null,
            'title' => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'crop_type' => fake()->randomElement(['ধান', 'পাট', 'সবজি', 'ভুট্টা', 'গম']),
            'status' => fake()->randomElement(['open', 'assigned', 'resolved', 'escalated']),
            'district' => fake()->city(),
            'division' => fake()->randomElement(['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet']),
            'assigned_at' => null,
            'resolved_at' => null,
        ];
    }
}
