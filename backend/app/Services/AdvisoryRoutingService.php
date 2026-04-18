<?php

namespace App\Services;

use App\Models\AdvisoryTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdvisoryRoutingService
{
    /**
     * Assign the least-loaded agricultural officer to a ticket and return officer.
     */
    public function assignOfficer(AdvisoryTicket $ticket): ?User
    {
        return DB::transaction(function () use ($ticket) {
            $officer = $this->findLeastLoadedOfficer($ticket->district, $ticket->division);

            if (!$officer) {
                Log::warning("AdvisoryRoutingService: No officer available for ticket #{$ticket->id}.");
                return null;
            }

            $ticket->update([
                'assigned_officer_id' => $officer->id,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]);

            Log::info("AdvisoryRoutingService: Ticket #{$ticket->id} assigned to officer #{$officer->id}.");

            return $officer;
        });
    }

    /**
     * Find the officer with the lowest open assigned ticket count.
     *
     * Priority:
     * 1) District match
     * 2) Same division
     */
    private function findLeastLoadedOfficer(string $district, ?string $division): ?User
    {
        $officer = User::query()
            ->where('role', 'agricultural_officer')
            ->where('is_active', true)
            ->where('is_verified', true)
            ->where(function ($query) use ($district) {
                $query->whereHas('officerProfile', fn ($q) => $q->where('district', $district))
                    ->orWhereHas('farmerProfile', fn ($q) => $q->where('district', $district));
            })
            ->withCount([
                'assignedTickets as open_ticket_count' => fn ($q) => $q->where('status', 'assigned'),
            ])
            ->orderBy('open_ticket_count', 'asc')
            ->first();

        if ($officer) {
            return $officer;
        }

        if ($division) {
            return User::query()
                ->where('role', 'agricultural_officer')
                ->where('is_active', true)
                ->where('is_verified', true)
                ->where(function ($query) use ($division) {
                    $query->whereHas('officerProfile', fn ($q) => $q->where('division', $division))
                        ->orWhereHas('farmerProfile', fn ($q) => $q->where('division', $division));
                })
                ->withCount([
                    'assignedTickets as open_ticket_count' => fn ($q) => $q->where('status', 'assigned'),
                ])
                ->orderBy('open_ticket_count', 'asc')
                ->first();
        }

        return null;
    }
}
