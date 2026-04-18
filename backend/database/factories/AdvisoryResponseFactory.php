<?php

namespace Database\Factories;

use App\Models\AdvisoryResponse;
use App\Models\AdvisoryTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdvisoryResponse>
 */
class AdvisoryResponseFactory extends Factory
{
    protected $model = AdvisoryResponse::class;

    public function definition(): array
    {
        return [
            'ticket_id' => AdvisoryTicket::factory(),
            'officer_id' => User::factory()->officer(),
            'response_text' => fake()->paragraph(),
            'recommended_products' => [
                [
                    'name' => fake()->randomElement(['Urea', 'DAP', 'Fungicide']),
                    'category' => fake()->randomElement(['fertilizer', 'pesticide']),
                    'dosage' => fake()->randomElement(['1kg/acre', '500ml/acre', '2kg/acre']),
                ],
            ],
            'resolution_timeline' => fake()->randomElement(['3-5 days', '1 week', '10 days']),
            'is_visible_to_farmer' => true,
        ];
    }
}
