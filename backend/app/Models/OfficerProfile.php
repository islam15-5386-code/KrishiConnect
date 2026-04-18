<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'employee_id',
        'division',
        'district',
        'upazila',
        'specialization',
        'profile_photo_url',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Open ticket count — used by AdvisoryRoutingService for workload balancing.
     */
    public function openTicketCount(): int
    {
        return $this->user->assignedTickets()
            ->whereIn('status', ['open', 'assigned'])
            ->count();
    }
}
