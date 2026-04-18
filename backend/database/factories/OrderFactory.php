<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'farmer_id' => User::factory()->farmer(),
            'vendor_id' => User::factory()->vendor(),
            'status' => fake()->randomElement(['pending', 'confirmed', 'dispatched', 'delivered']),
            'delivery_address' => fake()->address(),
            'delivery_district' => fake()->city(),
            'payment_method' => fake()->randomElement(['bkash', 'nagad', 'sslcommerz', 'cod']),
            'payment_status' => fake()->randomElement(['unpaid', 'paid']),
            'payment_transaction_id' => fake()->optional()->uuid(),
            'total_bdt' => 0,
            'delivery_charge_bdt' => fake()->randomFloat(2, 0, 150),
            'cancellation_reason' => null,
            'dispatched_at' => null,
            'delivered_at' => null,
        ];
    }
}
