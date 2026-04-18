<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FarmerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'division',
        'district',
        'upazila',
        'land_size_acres',
        'primary_crops',
        'profile_photo_url',
        'national_id',
    ];

    protected $casts = [
        'primary_crops'   => 'array',
        'land_size_acres' => 'decimal:2',
    ];

    protected $hidden = ['national_id']; // PII — only expose via explicit policy

    // ──────────────────────────────────────────────
    // AES-256 for national_id (PII)
    // ──────────────────────────────────────────────

    public function setNationalIdAttribute(?string $value): void
    {
        $this->attributes['national_id'] = $value
            ? \Illuminate\Support\Facades\Crypt::encryptString($value)
            : null;
    }

    public function getNationalIdAttribute(?string $value): ?string
    {
        return $value
            ? \Illuminate\Support\Facades\Crypt::decryptString($value)
            : null;
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
