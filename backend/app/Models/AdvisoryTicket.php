<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdvisoryTicket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'farmer_id',
        'assigned_officer_id',
        'title',
        'description',
        'crop_type',
        'status',
        'district',
        'division',
        'assigned_at',
        'resolved_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_officer_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(AdvisoryImage::class, 'ticket_id');
    }

    public function advisoryImages(): HasMany
    {
        return $this->hasMany(AdvisoryImage::class, 'ticket_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AdvisoryResponse::class, 'ticket_id');
    }

    public function advisoryResponses(): HasMany
    {
        return $this->hasMany(AdvisoryResponse::class, 'ticket_id');
    }

    public function rating(): HasOne
    {
        return $this->hasOne(OfficerRating::class, 'ticket_id');
    }

    // ──────────────────────────────────────────────
    // Scopes
    // ──────────────────────────────────────────────

    /** Tickets that have been assigned but have had no response within 24 hours */
    public function scopeStale($query)
    {
        return $query->where('status', 'assigned')
                     ->where('assigned_at', '<=', now()->subHours(24))
                     ->whereDoesntHave('responses');
    }

    public function scopeByDistrict($query, string $district)
    {
        return $query->where('district', $district);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    public function isOpen(): bool      { return $this->status === 'open'; }
    public function isAssigned(): bool  { return $this->status === 'assigned'; }
    public function isResolved(): bool  { return $this->status === 'resolved'; }
    public function isEscalated(): bool { return $this->status === 'escalated'; }
}
