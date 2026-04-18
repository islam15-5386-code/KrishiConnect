<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdvisoryResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'officer_id',
        'response_text',
        'recommended_products',
        'resolution_timeline',
        'is_visible_to_farmer',
    ];

    protected $casts = [
        'recommended_products'  => 'array',
        'is_visible_to_farmer'  => 'boolean',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(AdvisoryTicket::class, 'ticket_id');
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'officer_id');
    }
}
