<?php

namespace Database\Factories;

use App\Models\FarmerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FarmerProfile>
 */
class FarmerProfileFactory extends Factory
{
    protected $model = FarmerProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->farmer(),
            'full_name' => fake()->name(),
            'division' => fake()->randomElement(['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet']),
            'district' => fake()->city(),
            'upazila' => fake()->citySuffix(),
            'land_size_acres' => fake()->randomFloat(2, 0.5, 20),
            'primary_crops' => fake()->randomElements(['ধান', 'পাট', 'গম', 'সবজি', 'ভুট্টা'], fake()->numberBetween(1, 3)),
            'profile_photo_url' => fake()->optional()->imageUrl(),
            'national_id' => fake()->optional()->numerify('#################'),
        ];
    }
}
