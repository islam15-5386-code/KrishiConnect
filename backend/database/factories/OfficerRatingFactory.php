<?php

namespace Database\Factories;

use App\Models\AdvisoryTicket;
use App\Models\OfficerRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OfficerRating>
 */
class OfficerRatingFactory extends Factory
{
    protected $model = OfficerRating::class;

    public function definition(): array
    {
        return [
            'ticket_id' => AdvisoryTicket::factory(),
            'farmer_id' => User::factory()->farmer(),
            'officer_id' => User::factory()->officer(),
            'rating' => fake()->numberBetween(3, 5),
            'feedback' => fake()->optional()->sentence(),
        ];
    }
}
