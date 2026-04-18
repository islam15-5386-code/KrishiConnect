<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'farmer_id',
        'vendor_id',
        'status',
        'delivery_address',
        'delivery_district',
        'payment_method',
        'payment_status',
        'payment_transaction_id',
        'total_bdt',
        'delivery_charge_bdt',
        'cancellation_reason',
        'dispatched_at',
        'delivered_at',
    ];

    protected $casts = [
        'total_bdt'           => 'decimal:2',
        'delivery_charge_bdt' => 'decimal:2',
        'dispatched_at'       => 'datetime',
        'delivered_at'        => 'datetime',
    ];

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeByStatus($query, ?string $status)
    {
        return $status ? $query->where('status', $status) : $query;
    }
}
