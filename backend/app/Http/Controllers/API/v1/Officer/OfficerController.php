<?php

namespace App\Http\Controllers\API\v1\Officer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Officer\RespondToTicketRequest;
use App\Http\Requests\Officer\BroadcastRequest;
use App\Models\AdvisoryTicket;
use App\Models\AdvisoryResponse;
use App\Models\OfficerBroadcast;
use App\Models\User;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfficerController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    // GET /api/v1/officer/tickets
    public function tickets(Request $request): JsonResponse
    {
        $tickets = AdvisoryTicket::with(['farmer.farmerProfile', 'images', 'responses', 'rating'])
            ->where('assigned_officer_id', $request->user()->id)
            ->when($request->query('status'), fn($q) => $q->where('status', $request->query('status')))
            ->latest()
            ->paginate(20);

        return $this->success($tickets);
    }

    // POST /api/v1/officer/tickets/{id}/respond
    public function respond(RespondToTicketRequest $request, int $id): JsonResponse
    {
        $officer = $request->user();
        $ticket  = AdvisoryTicket::where('assigned_officer_id', $officer->id)
                                 ->whereIn('status', ['assigned', 'escalated'])
                                 ->findOrFail($id);

        $data = $request->validated();

        DB::transaction(function () use ($ticket, $officer, $data) {
            AdvisoryResponse::create([
                'ticket_id'            => $ticket->id,
                'officer_id'           => $officer->id,
                'response_text'        => $data['response_text'],
                'recommended_products' => $data['recommended_products'] ?? [],
                'resolution_timeline'  => $data['resolution_timeline'] ?? null,
            ]);

            // Mark ticket as resolved
            $ticket->update([
                'status'      => 'resolved',
                'resolved_at' => now(),
            ]);
        });

        // Notify farmer their problem has been answered
        $this->notificationService->sendPush(
            user: $ticket->farmer,
            title: '✅ আপনার সমস্যার সমাধান এসেছে',
            body: 'একজন কৃষি বিশেষজ্ঞ আপনার ফসলের সমস্যার জবাব দিয়েছেন।',
            data: ['type' => 'advisory_response', 'ticket_id' => $ticket->id]
        );

        // Also send SMS for farmers without smartphones
        $this->notificationService->sendSms(
            phone: $ticket->farmer->phone_number,
            message: "KrishiConnect: আপনার ফসলের সমস্যার (টিকিট #{$ticket->id}) সমাধান এসেছে। অ্যাপ খুলুন।"
        );

        return $this->success(null, 'পরামর্শ জমা হয়েছে। কৃষককে জানানো হয়েছে।');
    }

    // POST /api/v1/officer/broadcasts
    public function broadcast(BroadcastRequest $request): JsonResponse
    {
        $officer = $request->user();
        $data    = $request->validated();

        $profile  = $officer->officerProfile;
        $district = $data['district'] ?? $profile->district;

        // Find all farmers in the target district with FCM tokens
        $farmerQuery = User::where('role', 'farmer')
                           ->where('is_active', true)
                           ->whereHas('farmerProfile', fn($q) => $q->where('district', $district));

        if (!empty($data['crop_type'])) {
            // Filter to farmers who grow this specific crop
            $farmerQuery->whereHas('farmerProfile', function ($q) use ($data) {
                $q->whereJsonContains('primary_crops', $data['crop_type']);
            });
        }

        $farmers = $farmerQuery->get();

        $sentCount = 0;

        foreach ($farmers as $farmer) {
            $channel = $data['channel'] ?? 'both';

            if (in_array($channel, ['push', 'both']) && $farmer->fcm_token) {
                $this->notificationService->sendPush(
                    user: $farmer,
                    title: "📢 {$data['title']}",
                    body: $data['message'],
                    data: ['type' => 'broadcast', 'district' => $district]
                );
            }

            if (in_array($channel, ['sms', 'both'])) {
                $this->notificationService->sendSms($farmer->phone_number, "{$data['title']}: {$data['message']}");
            }

            $sentCount++;
        }

        OfficerBroadcast::create([
            'officer_id' => $officer->id,
            'title'      => $data['title'],
            'message'    => $data['message'],
            'district'   => $district,
            'crop_type'  => $data['crop_type'] ?? null,
            'channel'    => $data['channel'] ?? 'both',
            'sent_count' => $sentCount,
            'sent_at'    => now(),
        ]);

        return $this->success(
            ['sent_to' => $sentCount, 'district' => $district],
            "{$sentCount} জন কৃষককে বার্তা পাঠানো হয়েছে।"
        );
    }
}
