<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_hash',
        'code',
        'purpose',
        'expires_at',
        'is_used',
        'attempts',
        'ip_address',
    ];

    protected $hidden = ['code']; // Never serialize OTP codes in API responses

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used'    => 'boolean',
        'attempts'   => 'integer',
    ];

    /**
     * Check whether this OTP is still valid.
     */
    public function isValid(string $code): bool
    {
        return !$this->is_used
            && $this->expires_at->isFuture()
            && $this->code === $code
            && $this->attempts <= 3;
    }

    /**
     * Mark this OTP as used.
     */
    public function markUsed(): void
    {
        $this->update(['is_used' => true]);
    }
}
