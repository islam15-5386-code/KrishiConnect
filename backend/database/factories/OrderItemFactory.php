<?php

namespace Database\Factories;

use App\Models\MarketplaceProduct;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => MarketplaceProduct::factory(),
            'quantity' => fake()->numberBetween(1, 6),
            'unit_price' => fake()->randomFloat(2, 80, 5000),
        ];
    }
}
