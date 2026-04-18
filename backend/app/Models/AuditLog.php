<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event',
        'phone_hash',
        'ip_address',
        'user_agent',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'metadata'    => 'array',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a security event without blocking the request (fire-and-forget).
     */
    public static function logEvent(
        string $event,
        ?int $userId = null,
        ?string $phoneHash = null,
        array $metadata = []
    ): void {
        static::create([
            'user_id'    => $userId,
            'event'      => $event,
            'phone_hash' => $phoneHash,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata'   => $metadata,
            'occurred_at'=> now(),
        ]);
    }
}
