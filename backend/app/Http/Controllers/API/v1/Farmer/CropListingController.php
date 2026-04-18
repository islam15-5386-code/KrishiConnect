<?php

namespace App\Http\Controllers\API\v1\Farmer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Farmer\CreateCropListingRequest;
use App\Http\Requests\Farmer\RespondOfferRequest;
use App\Models\CropListing;
use App\Models\PurchaseOffer;
use App\Services\NotificationService;
use App\Services\PricingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class CropListingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PricingService $pricingService,
        private readonly NotificationService $notificationService,
    ) {}

    // POST /api/v1/crop-listings
    public function store(CreateCropListingRequest $request): JsonResponse
    {
        $user    = $request->user();
        $data    = $request->validated();
        $profile = $user->farmerProfile;

        if (!$profile) {
            return $this->error('প্রোফাইল সম্পন্ন করুন।', [], 422);
        }

        // Fetch market benchmark price at time of listing for comparison
        $benchmark = $this->pricingService->getCurrentPrice(
            $data['crop_type'],
            $data['location_district'] ?? $profile->district
        );

        $listing = DB::transaction(function () use ($user, $data, $profile, $benchmark, $request) {
            $photoUrls = [];

            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $path        = $photo->store("crop-listings/{$user->id}", 's3');
                    $photoUrls[] = Storage::disk('s3')->url($path);
                }
            }

            return CropListing::create([
                'farmer_id'               => $user->id,
                'crop_type'               => $data['crop_type'],
                'quantity_kg'             => $data['quantity_kg'],
                'quality_grade'           => $data['quality_grade'],
                'asking_price_bdt'        => $data['asking_price_bdt'],
                'location_district'       => $data['location_district'] ?? $profile->district,
                'location_upazila'        => $data['location_upazila'] ?? $profile->upazila,
                'harvest_date'            => $data['harvest_date'] ?? null,
                'description'             => $data['description'] ?? null,
                'photos'                  => $photoUrls,
                'status'                  => 'available',
                'market_benchmark_price'  => $benchmark['price_bdt_per_kg'] ?? null,
            ]);
        });

        return $this->created([
            'listing'   => $listing,
            'benchmark' => $benchmark,
        ], 'ফসল তালিকা প্রকাশিত হয়েছে।');
    }

    // GET /api/v1/crop-listings/mine
    public function mine(Request $request): JsonResponse
    {
        $listings = CropListing::with(['offers' => fn($q) => $q->latest()])
            ->where('farmer_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return $this->success($listings);
    }

    // POST /api/v1/crop-listings/{id}/offers/{offerId}/respond
    public function respondToOffer(RespondOfferRequest $request, int $listingId, int $offerId): JsonResponse
    {
        $user    = $request->user();
        $listing = CropListing::where('farmer_id', $user->id)->findOrFail($listingId);
        $offer   = PurchaseOffer::where('crop_listing_id', $listing->id)->findOrFail($offerId);

        if ($offer->isExpired()) {
            return $this->error('এই অফারের মেয়াদ শেষ হয়ে গেছে।', [], 422);
        }

        $data   = $request->validated();
        $action = $data['action']; // accept | reject | counter

        DB::transaction(function () use ($offer, $data, $action, $listing, $user) {
            match ($action) {
                'accept' => $this->acceptOffer($offer, $listing),
                'reject' => $offer->update(['status' => 'rejected']),
                'counter'=> $this->counterOffer($offer, $data, $user),
            };

            $offer->appendNegotiationEvent(
                actor: 'farmer',
                action: $action,
                price: $action === 'counter' ? $data['counter_price_bdt'] : $offer->offered_price_bdt,
                note: $data['note'] ?? null,
            );
        });

        // Notify company of farmer's response
        $this->notificationService->sendPush(
            user: $offer->company,
            title: '📬 কৃষক সাড়া দিয়েছেন',
            body: "আপনার অফারে কৃষক " . match($action) {
                'accept'  => 'সম্মত হয়েছেন।',
                'reject'  => 'প্রত্যাখ্যান করেছেন।',
                'counter' => "পাল্টা দাম দিয়েছেন: ৳{$data['counter_price_bdt']}/কেজি",
            },
            data: ['type' => "offer_{$action}", 'offer_id' => $offer->id]
        );

        return $this->success($offer->fresh(), 'অফারে সাড়া দেওয়া হয়েছে।');
    }

    private function acceptOffer(PurchaseOffer $offer, CropListing $listing): void
    {
        $offer->update(['status' => 'accepted']);
        // Reject all other pending offers on this listing
        PurchaseOffer::where('crop_listing_id', $listing->id)
                     ->where('id', '!=', $offer->id)
                     ->where('status', 'pending')
                     ->update(['status' => 'rejected']);
        $listing->update(['status' => 'negotiating']);
    }

    private function counterOffer(PurchaseOffer $offer, array $data, $user): void
    {
        $offer->update([
            'status'            => 'countered',
            'counter_price_bdt' => $data['counter_price_bdt'],
        ]);
    }
}
