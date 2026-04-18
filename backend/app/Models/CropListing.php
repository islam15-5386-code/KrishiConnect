<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CropListing extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'farmer_id',
        'crop_type',
        'quantity_kg',
        'quality_grade',
        'asking_price_bdt',
        'location_district',
        'location_upazila',
        'harvest_date',
        'description',
        'photos',
        'status',
        'market_benchmark_price',
    ];

    protected $casts = [
        'photos'                  => 'array',
        'quantity_kg'             => 'decimal:2',
        'asking_price_bdt'        => 'decimal:2',
        'market_benchmark_price'  => 'decimal:2',
        'harvest_date'            => 'date',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(PurchaseOffer::class, 'crop_listing_id');
    }

    public function purchaseOffers(): HasMany
    {
        return $this->hasMany(PurchaseOffer::class, 'crop_listing_id');
    }

    public function pendingOffers(): HasMany
    {
        return $this->hasMany(PurchaseOffer::class, 'crop_listing_id')
                    ->where('status', 'pending');
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeFilterByCrop($query, ?string $crop)
    {
        return $crop ? $query->where('crop_type', $crop) : $query;
    }

    public function scopeFilterByDistrict($query, ?string $district)
    {
        return $district ? $query->where('location_district', $district) : $query;
    }

    public function scopeFilterByGrade($query, ?string $grade)
    {
        return $grade ? $query->where('quality_grade', $grade) : $query;
    }

    // ──────────────────────────────────────────────
    // Computed
    // ──────────────────────────────────────────────

    /**
     * Price difference from market benchmark (positive = above market).
     */
    public function getPriceDiffAttribute(): ?float
    {
        if (!$this->market_benchmark_price) {
            return null;
        }
        return $this->asking_price_bdt - $this->market_benchmark_price;
    }
}
