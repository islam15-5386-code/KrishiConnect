<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdvisoryImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'image_url',
        'original_filename',
        'file_size_bytes',
        'mime_type',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(AdvisoryTicket::class, 'ticket_id');
    }
}
