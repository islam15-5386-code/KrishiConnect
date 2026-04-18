<?php

namespace App\Console\Commands;

use App\Models\AdvisoryTicket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CheckStaleTickets extends Command
{
    /**
     * Runs every hour via Laravel scheduler.
     * Finds tickets assigned but with no response after 24 hours → escalates.
     */
    protected $signature   = 'tickets:check-stale';
    protected $description = 'Escalate advisory tickets with no officer response after 24 hours.';

    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $staleTickets = AdvisoryTicket::query()
            ->where('status', 'assigned')
            ->where('updated_at', '<', now()->subHours(24))
            ->whereDoesntHave('responses')
            ->with(['farmer', 'officer'])
            ->get();

        $admins = User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->get();

        if ($staleTickets->isEmpty()) {
            $this->info('[' . now()->toDateTimeString() . '] No stale tickets found.');
            return self::SUCCESS;
        }

        $this->warn("[" . now()->toDateTimeString() . "] Found {$staleTickets->count()} stale ticket(s). Escalating...");

        foreach ($staleTickets as $ticket) {
            try {
                $ticket->update(['status' => 'escalated']);

                foreach ($admins as $admin) {
                    if (!empty($admin->fcm_token)) {
                        $this->notificationService->sendFcmPush(
                            (string) $admin->fcm_token,
                            'Advisory Ticket Escalated',
                            "Ticket #{$ticket->id} has no response for over 24 hours.",
                            [
                                'type' => 'ticket_escalated',
                                'ticket_id' => (string) $ticket->id,
                                'district' => (string) $ticket->district,
                            ]
                        );
                    }

                    if (!empty($admin->email)) {
                        Mail::raw(
                            "Ticket #{$ticket->id} has been escalated due to no advisory response in 24 hours.",
                            static function ($message) use ($admin, $ticket): void {
                                $message->to($admin->email)
                                    ->subject("[KrishiConnect] Escalated Ticket #{$ticket->id}");
                            }
                        );
                    }
                }

                $this->line("  ↳ Ticket #{$ticket->id} escalated (District: {$ticket->district}, Officer: #{$ticket->assigned_officer_id})");
            } catch (\Throwable $e) {
                Log::error("CheckStaleTickets: Failed to escalate ticket #{$ticket->id}: {$e->getMessage()}");
                $this->error("  ↳ Failed to escalate ticket #{$ticket->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Escalated {$staleTickets->count()} ticket(s).");
        return self::SUCCESS;
    }
}
