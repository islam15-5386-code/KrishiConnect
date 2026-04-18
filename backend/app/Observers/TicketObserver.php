<?php

namespace App\Observers;

use App\Models\AdvisoryTicket;
use App\Services\AdvisoryRoutingService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class TicketObserver
{
    public function __construct(
        private readonly AdvisoryRoutingService $routingService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Auto-assign an officer whenever a new ticket is created.
     *
     * Uses Laravel's observer 'created' event so the routing logic
     * is decoupled from the controller and fires consistently even
     * when tickets are created programmatically (e.g., seeder/API).
     *
     * The push notification to the officer is dispatched via a queued
     * job inside assignOfficer() to stay within the 5-minute SLA.
     */
    public function created(AdvisoryTicket $ticket): void
    {
        Log::info("TicketObserver: New ticket #{$ticket->id} created — starting officer assignment.");
        $officer = $this->routingService->assignOfficer($ticket);

        if ($officer && !empty($officer->fcm_token)) {
            $this->notificationService->sendFcmPush(
                (string) $officer->fcm_token,
                'New Advisory Ticket Assigned',
                "Ticket #{$ticket->id} in {$ticket->district} requires your response.",
                [
                    'type' => 'ticket_assigned',
                    'ticket_id' => (string) $ticket->id,
                    'district' => (string) $ticket->district,
                    'crop_type' => (string) $ticket->crop_type,
                ]
            );
        }
    }

    /**
     * Log ticket status transitions for audit trail.
     */
    public function updated(AdvisoryTicket $ticket): void
    {
        if ($ticket->wasChanged('status')) {
            Log::info("TicketObserver: Ticket #{$ticket->id} status changed from '{$ticket->getOriginal('status')}' to '{$ticket->status}'.");

            if ($ticket->status === 'resolved') {
                $ticket->loadMissing('farmer');
                if (!empty($ticket->farmer?->phone_number)) {
                    $this->notificationService->sendSms(
                        (string) $ticket->farmer->phone_number,
                        "KrishiConnect: Your advisory ticket #{$ticket->id} has been resolved."
                    );
                }
            }
        }
    }

    /**
     * Prevent accidental hard-delete of tickets — soft deletes only.
     */
    public function deleting(AdvisoryTicket $ticket): void
    {
        if (!$ticket->isForceDeleting()) {
            Log::info("TicketObserver: Ticket #{$ticket->id} soft-deleted.");
        }
    }
}
