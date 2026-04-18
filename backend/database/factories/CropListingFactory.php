<?php

namespace Database\Factories;

use App\Models\CropListing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CropListing>
 */
class CropListingFactory extends Factory
{
    protected $model = CropListing::class;

    public function definition(): array
    {
        $asking = fake()->randomFloat(2, 20, 120);

        return [
            'farmer_id' => User::factory()->farmer(),
            'crop_type' => fake()->randomElement(['ধান', 'পাট', 'সবজি', 'ভুট্টা', 'গম']),
            'quantity_kg' => fake()->randomFloat(2, 100, 8000),
            'quality_grade' => fake()->randomElement(['A', 'B', 'C']),
            'asking_price_bdt' => $asking,
            'location_district' => fake()->city(),
            'location_upazila' => fake()->citySuffix(),
            'harvest_date' => fake()->dateTimeBetween('-30 days', '+30 days')->format('Y-m-d'),
            'description' => fake()->optional()->sentence(15),
            'photos' => [fake()->imageUrl(), fake()->imageUrl()],
            'status' => fake()->randomElement(['available', 'negotiating', 'sold']),
            'market_benchmark_price' => max(1, $asking - fake()->randomFloat(2, 0, 10)),
        ];
    }
}
