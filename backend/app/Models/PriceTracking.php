<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceTracking extends Model
{
    use HasFactory;

    protected $table = 'price_tracking';

    protected $fillable = [
        'crop_type',
        'region_district',
        'region_division',
        'price_bdt_per_kg',
        'recorded_at',
        'source',
        'quality_grade',
    ];

    protected $casts = [
        'price_bdt_per_kg' => 'decimal:2',
        'recorded_at'      => 'datetime',
    ];

    /**
     * Get the latest recorded price for a crop + district.
     * Results are Redis-cached by PricingService.
     */
    public static function latestFor(string $cropType, string $district): ?static
    {
        return static::where('crop_type', $cropType)
                     ->where('region_district', $district)
                     ->orderBy('recorded_at', 'desc')
                     ->first();
    }
}
