<?php

namespace Database\Factories;

use App\Models\AdvisoryImage;
use App\Models\AdvisoryTicket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdvisoryImage>
 */
class AdvisoryImageFactory extends Factory
{
    protected $model = AdvisoryImage::class;

    public function definition(): array
    {
        $filename = fake()->lexify('crop-??????') . '.jpg';

        return [
            'ticket_id' => AdvisoryTicket::factory(),
            'image_url' => 'https://cdn.krishiconnect.local/advisory/' . $filename,
            'original_filename' => $filename,
            'file_size_bytes' => fake()->numberBetween(150000, 3000000),
            'mime_type' => 'image/jpeg',
        ];
    }
}
