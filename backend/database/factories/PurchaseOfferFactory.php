<?php

namespace Database\Factories;

use App\Models\CropListing;
use App\Models\PurchaseOffer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOffer>
 */
class PurchaseOfferFactory extends Factory
{
    protected $model = PurchaseOffer::class;

    public function definition(): array
    {
        $offered = fake()->randomFloat(2, 20, 120);

        return [
            'crop_listing_id' => CropListing::factory(),
            'company_id' => User::factory()->company(),
            'offered_price_bdt' => $offered,
            'quantity_kg' => fake()->randomFloat(2, 100, 5000),
            'pickup_logistics' => fake()->sentence(),
            'status' => fake()->randomElement(['pending', 'countered', 'accepted', 'rejected']),
            'negotiation_history' => [
                [
                    'actor' => 'company',
                    'action' => 'offer_created',
                    'price' => $offered,
                    'timestamp' => now()->subHours(6)->toIso8601String(),
                ],
            ],
            'counter_price_bdt' => fake()->optional()->randomFloat(2, $offered, $offered + 10),
            'expires_at' => now()->addDays(fake()->numberBetween(1, 7)),
        ];
    }
}
