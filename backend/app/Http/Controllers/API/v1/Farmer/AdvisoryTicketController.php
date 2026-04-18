<?php

namespace App\Http\Controllers\API\v1\Farmer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Farmer\CreateTicketRequest;
use App\Http\Requests\Farmer\RateOfficerRequest;
use App\Models\AdvisoryTicket;
use App\Models\AdvisoryImage;
use App\Models\OfficerRating;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class AdvisoryTicketController extends Controller
{
    use ApiResponse;

    private const MAX_IMAGES = 5;

    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    // GET /api/v1/advisory/tickets
    public function index(Request $request): JsonResponse
    {
        $tickets = AdvisoryTicket::with(['images', 'responses', 'rating'])
            ->where('farmer_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return $this->success($tickets);
    }

    // GET /api/v1/advisory/tickets/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        $ticket = AdvisoryTicket::with(['images', 'responses.officer', 'officer', 'rating'])
            ->where('farmer_id', $request->user()->id)
            ->findOrFail($id);

        return $this->success($ticket);
    }

    // POST /api/v1/advisory/tickets
    public function store(CreateTicketRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Get farmer's district from profile for auto-routing
        $profile = $user->farmerProfile;
        if (!$profile) {
            return $this->error('প্রোফাইল সম্পন্ন করুন আগে।', [], 422);
        }

        $ticket = DB::transaction(function () use ($user, $data, $profile, $request) {
            $ticket = AdvisoryTicket::create([
                'farmer_id'   => $user->id,
                'title'       => $data['title'],
                'description' => $data['description'],
                'crop_type'   => $data['crop_type'],
                'district'    => $data['district'] ?? $profile->district,
                'division'    => $profile->division,
                'status'      => 'open',
            ]);

            // Handle up to 5 image uploads to S3
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                $count  = min(count($images), self::MAX_IMAGES);

                for ($i = 0; $i < $count; $i++) {
                    $file    = $images[$i];
                    $path    = $file->store("tickets/{$ticket->id}", 's3');
                    $url     = Storage::disk('s3')->url($path);

                    AdvisoryImage::create([
                        'ticket_id'         => $ticket->id,
                        'image_url'         => $url,
                        'original_filename' => $file->getClientOriginalName(),
                        'file_size_bytes'   => $file->getSize(),
                        'mime_type'         => $file->getMimeType(),
                    ]);
                }
            }

            return $ticket;
        });

        // TicketObserver::created() triggers officer assignment automatically
        return $this->created(
            $ticket->fresh()->load(['images']),
            'সমস্যার টিকিট জমা হয়েছে। একজন কর্মকর্তা শীঘ্রই যোগাযোগ করবেন।'
        );
    }

    // POST /api/v1/advisory/tickets/{id}/rate
    public function rate(RateOfficerRequest $request, int $id): JsonResponse
    {
        $user   = $request->user();
        $ticket = AdvisoryTicket::where('farmer_id', $user->id)
                               ->where('status', 'resolved')
                               ->findOrFail($id);

        if ($ticket->rating()->exists()) {
            return $this->error('আপনি ইতিমধ্যে এই টিকিটে রেটিং দিয়েছেন।', [], 409);
        }

        $data = $request->validated();

        OfficerRating::create([
            'ticket_id'  => $ticket->id,
            'farmer_id'  => $user->id,
            'officer_id' => $ticket->assigned_officer_id,
            'rating'     => $data['rating'],
            'feedback'   => $data['feedback'] ?? null,
        ]);

        return $this->success(null, 'রেটিং জমা হয়েছে। ধন্যবাদ।');
    }
}
