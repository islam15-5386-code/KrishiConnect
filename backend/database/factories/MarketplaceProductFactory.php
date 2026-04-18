<?php

namespace Database\Factories;

use App\Models\MarketplaceProduct;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MarketplaceProduct>
 */
class MarketplaceProductFactory extends Factory
{
    protected $model = MarketplaceProduct::class;

    public function definition(): array
    {
        return [
            'vendor_id' => User::factory()->vendor(),
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement(['Fertilizer', 'Pesticide', 'Seed', 'Tool', 'Equipment', 'Other']),
            'description' => fake()->optional()->paragraph(),
            'price_bdt' => fake()->randomFloat(2, 50, 15000),
            'stock_quantity' => fake()->numberBetween(10, 500),
            'images' => [fake()->imageUrl(), fake()->imageUrl()],
            'certifications' => fake()->randomElements(['BADC Certified', 'Organic', 'BSTI'], fake()->numberBetween(0, 2)),
            'is_approved' => true,
            'is_active' => true,
            'unit' => fake()->randomElement(['piece', 'kg', 'litre', 'packet']),
        ];
    }
}
