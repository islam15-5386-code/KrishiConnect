<?php

namespace App\Services;

use App\Models\PriceTracking;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PricingService
{
    /**
     * Redis TTL for price cache: 30 minutes.
     * Balances freshness vs. DB load; price data doesn't change per-minute.
     */
    private const CACHE_TTL_SECONDS = 1800;

    /**
     * Get the latest recorded market price for a crop in a district.
     *
     * Flow: Redis cache → PostgreSQL → null (no data)
     * Response time target: < 30ms with cache hit (well within 500ms p95 API target).
     *
     * @param string      $cropType  Crop name (e.g. "ধান", "পাট")
     * @param string      $district  Bangladesh district name
     * @param string|null $grade     Quality grade filter (A/B/C), null = any
     * @return array|null Price data or null if not found
     */
    public function getCurrentPrice(string $cropType, string $district, ?string $grade = null): ?array
    {
        $cacheKey = "price:{$cropType}:{$district}" . ($grade ? ":{$grade}" : '');

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($cropType, $district, $grade) {
            $query = PriceTracking::query()
                ->where('crop_type', $cropType)
                ->where('region_district', $district)
                ->orderBy('recorded_at', 'desc');

            if ($grade) {
                $query->where('quality_grade', $grade);
            }

            $record = $query->first();

            if (!$record) {
                // Fallback: search division-level or national average
                $record = PriceTracking::query()
                    ->where('crop_type', $cropType)
                    ->orderBy('recorded_at', 'desc')
                    ->first();
            }

            if (!$record) {
                return null;
            }

            return [
                'crop_type'        => $record->crop_type,
                'district'         => $record->region_district,
                'price_bdt_per_kg' => (float) $record->price_bdt_per_kg,
                'quality_grade'    => $record->quality_grade,
                'recorded_at'      => $record->recorded_at->toIso8601String(),
                'source'           => $record->source,
                'is_national_avg'  => $record->region_district !== $district,
            ];
        });
    }

    /**
     * Get price trend for a crop in a district over the last N days.
     * Used by the Company dashboard analytics chart (Chart.js).
     *
     * @param string $cropType Crop name
     * @param string $district District name
     * @param int    $days     Number of past days to fetch (default: 30)
     */
    public function getPriceTrend(string $cropType, string $district, int $days = 30): array
    {
        $cacheKey = "price_trend:{$cropType}:{$district}:{$days}";

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($cropType, $district, $days) {
            return PriceTracking::query()
                ->where('crop_type', $cropType)
                ->where('region_district', $district)
                ->where('recorded_at', '>=', now()->subDays($days))
                ->orderBy('recorded_at', 'asc')
                ->get(['recorded_at', 'price_bdt_per_kg', 'quality_grade'])
                ->map(fn($r) => [
                    'date'  => $r->recorded_at->format('Y-m-d'),
                    'price' => (float) $r->price_bdt_per_kg,
                    'grade' => $r->quality_grade,
                ])
                ->toArray();
        });
    }

    /**
     * Invalidate Redis price cache for a crop+district pair.
     * Called after price_tracking insert to prevent stale benchmark display.
     */
    public function invalidateCache(string $cropType, string $district): void
    {
        Cache::forget("price:{$cropType}:{$district}");
        Cache::forget("price_trend:{$cropType}:{$district}:7");
        Cache::forget("price_trend:{$cropType}:{$district}:30");
        Log::debug("PricingService: Cache invalidated for {$cropType}/{$district}");
    }

    /**
     * Get a district-level price heatmap — all crops, one district.
     * Used by Company dashboard /analytics page.
     */
    public function getDistrictHeatmap(): array
    {
        return Cache::remember('price_heatmap', self::CACHE_TTL_SECONDS, function () {
            return PriceTracking::query()
                ->selectRaw('region_district, crop_type, MAX(price_bdt_per_kg) as latest_price, MAX(recorded_at) as last_updated')
                ->groupBy('region_district', 'crop_type')
                ->orderBy('region_district')
                ->get()
                ->toArray();
        });
    }
}
