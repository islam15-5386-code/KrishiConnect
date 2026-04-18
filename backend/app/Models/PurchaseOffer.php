<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'crop_listing_id',
        'company_id',
        'offered_price_bdt',
        'quantity_kg',
        'pickup_logistics',
        'status',
        'negotiation_history',
        'counter_price_bdt',
        'expires_at',
    ];

    protected $casts = [
        'negotiation_history' => 'array',
        'offered_price_bdt'   => 'decimal:2',
        'counter_price_bdt'   => 'decimal:2',
        'quantity_kg'         => 'decimal:2',
        'expires_at'          => 'datetime',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function cropListing(): BelongsTo
    {
        return $this->belongsTo(CropListing::class, 'crop_listing_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_id');
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * Append an event to the negotiation history trail.
     */
    public function appendNegotiationEvent(string $actor, string $action, float $price, ?string $note = null): void
    {
        $history = $this->negotiation_history ?? [];
        $history[] = [
            'actor'     => $actor,
            'action'    => $action,
            'price'     => $price,
            'note'      => $note,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->negotiation_history = $history;
        $this->save();
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
