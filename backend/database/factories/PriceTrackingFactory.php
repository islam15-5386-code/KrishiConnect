<?php

namespace Database\Factories;

use App\Models\PriceTracking;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceTracking>
 */
class PriceTrackingFactory extends Factory
{
    protected $model = PriceTracking::class;

    public function definition(): array
    {
        return [
            'crop_type' => fake()->randomElement(['ধান', 'পাট', 'সবজি', 'ভুট্টা', 'গম']),
            'region_district' => fake()->city(),
            'region_division' => fake()->randomElement(['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet']),
            'price_bdt_per_kg' => fake()->randomFloat(2, 15, 140),
            'recorded_at' => now()->subDays(fake()->numberBetween(0, 14)),
            'source' => fake()->randomElement(['manual', 'DAE', 'scraped', 'market_report']),
            'quality_grade' => fake()->randomElement(['A', 'B', 'C', null]),
        ];
    }
}
