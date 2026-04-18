<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'phone_number',
        'phone_hash',
        'role',
        'is_verified',
        'fcm_token',
        'preferred_language',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'phone_number', // AES-256 encrypted; don't expose raw ciphertext
        'remember_token',
    ];

    protected $casts = [
        'is_verified'    => 'boolean',
        'is_active'      => 'boolean',
        'last_login_at'  => 'datetime',
    ];

    // ──────────────────────────────────────────────
    // AES-256 Encryption Accessors (PII protection)
    // ──────────────────────────────────────────────

    /**
     * Set phone_number encrypted + store SHA-256 hash for lookup.
     */
    public function setPhoneNumberAttribute(string $value): void
    {
        $this->attributes['phone_number'] = Crypt::encryptString($value);
        $this->attributes['phone_hash']   = hash('sha256', $value);
    }

    /**
     * Decrypt phone_number on read.
     */
    public function getPhoneNumberAttribute(?string $value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function farmerProfile(): HasOne
    {
        return $this->hasOne(FarmerProfile::class);
    }

    public function officerProfile(): HasOne
    {
        return $this->hasOne(OfficerProfile::class);
    }

    /** Tickets created by this farmer */
    public function advisoryTickets(): HasMany
    {
        return $this->hasMany(AdvisoryTicket::class, 'farmer_id');
    }

    /** Alias for explicit farmer ticket relation naming */
    public function farmerAdvisoryTickets(): HasMany
    {
        return $this->hasMany(AdvisoryTicket::class, 'farmer_id');
    }

    /** Tickets assigned to this officer */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(AdvisoryTicket::class, 'assigned_officer_id');
    }

    /** Alias for explicit officer ticket relation naming */
    public function assignedAdvisoryTickets(): HasMany
    {
        return $this->hasMany(AdvisoryTicket::class, 'assigned_officer_id');
    }

    public function cropListings(): HasMany
    {
        return $this->hasMany(CropListing::class, 'farmer_id');
    }

    public function purchaseOffers(): HasMany
    {
        return $this->hasMany(PurchaseOffer::class, 'company_id');
    }

    public function marketplaceProducts(): HasMany
    {
        return $this->hasMany(MarketplaceProduct::class, 'vendor_id');
    }

    public function farmerOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'farmer_id');
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'vendor_id');
    }

    public function officerRatings(): HasMany
    {
        return $this->hasMany(OfficerRating::class, 'officer_id');
    }

    public function broadcasts(): HasMany
    {
        return $this->hasMany(OfficerBroadcast::class, 'officer_id');
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    public function isFarmer(): bool       { return $this->role === 'farmer'; }
    public function isOfficer(): bool      { return $this->role === 'agricultural_officer'; }
    public function isCompany(): bool      { return $this->role === 'company'; }
    public function isVendor(): bool       { return $this->role === 'vendor'; }
    public function isAdmin(): bool        { return $this->role === 'admin'; }

    /**
     * Find user by raw phone number (using hash for DB lookup).
     */
    public static function findByPhone(string $phone): ?static
    {
        return static::where('phone_hash', hash('sha256', $phone))->first();
    }

    /**
     * Create a Sanctum token with 24-hour expiry.
     */
    public function createApiToken(string $name = 'api'): \Laravel\Sanctum\NewAccessToken
    {
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 1440));
        return $this->createToken($name, ['*'], $expiresAt);
    }
}
