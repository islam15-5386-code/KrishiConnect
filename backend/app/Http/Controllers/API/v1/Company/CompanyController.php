<?php

namespace App\Http\Controllers\API\v1\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\SubmitOfferRequest;
use App\Models\CropListing;
use App\Models\PurchaseOffer;
use App\Services\NotificationService;
use App\Services\PricingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PricingService $pricingService,
        private readonly NotificationService $notificationService,
    ) {}

    // GET /api/v1/crop-listings (company view — all available listings)
    public function browseListings(Request $request): JsonResponse
    {
        $listings = CropListing::available()
            ->filterByCrop($request->query('crop_type'))
            ->filterByDistrict($request->query('district'))
            ->filterByGrade($request->query('quality_grade'))
            ->when($request->query('min_quantity'), fn($q) => $q->where('quantity_kg', '>=', $request->query('min_quantity')))
            ->with(['farmer.farmerProfile'])
            ->latest()
            ->paginate(20);

        // Attach current market price benchmark to each listing for comparison
        $listings->getCollection()->transform(function ($listing) {
            $benchmark = $this->pricingService->getCurrentPrice(
                $listing->crop_type,
                $listing->location_district
            );
            $listing->benchmark_price             = $benchmark['price_bdt_per_kg'] ?? null;
            $listing->price_diff_from_market      = $listing->benchmark_price
                ? round($listing->asking_price_bdt - $listing->benchmark_price, 2)
                : null;
            return $listing;
        });

        return $this->success($listings);
    }

    // POST /api/v1/crop-listings/{id}/offers
    public function submitOffer(SubmitOfferRequest $request, int $listingId): JsonResponse
    {
        $company = $request->user();
        $listing = CropListing::available()->findOrFail($listingId);
        $data    = $request->validated();

        // Prevent duplicate pending offers from the same company on the same listing
        $existing = PurchaseOffer::where('crop_listing_id', $listing->id)
                                 ->where('company_id', $company->id)
                                 ->whereIn('status', ['pending', 'countered'])
                                 ->first();

        if ($existing) {
            return $this->error('আপনার একটি সক্রিয় অফার ইতিমধ্যে আছে।', ['offer_id' => $existing->id], 409);
        }

        $offer = PurchaseOffer::create([
            'crop_listing_id'   => $listing->id,
            'company_id'        => $company->id,
            'offered_price_bdt' => $data['offered_price_bdt'],
            'quantity_kg'       => $data['quantity_kg'],
            'pickup_logistics'  => $data['pickup_logistics'] ?? null,
            'status'            => 'pending',
            'negotiation_history' => [[
                'actor'     => 'company',
                'action'    => 'initial_offer',
                'price'     => $data['offered_price_bdt'],
                'note'      => $data['note'] ?? null,
                'timestamp' => now()->toIso8601String(),
            ]],
            'expires_at' => isset($data['expires_in_hours'])
                ? now()->addHours($data['expires_in_hours'])
                : now()->addDays(3), // default 72h offer window
        ]);

        // Notify farmer of new offer
        $this->notificationService->sendPush(
            user: $listing->farmer,
            title: '💰 নতুন ক্রয় অফার',
            body: "{$listing->crop_type}: ৳{$data['offered_price_bdt']}/কেজি অফার এসেছে।",
            data: ['type' => 'new_offer', 'offer_id' => $offer->id, 'listing_id' => $listing->id]
        );

        $this->notificationService->sendSms(
            phone: $listing->farmer->phone_number,
            message: "KrishiConnect: আপনার {$listing->crop_type} এর জন্য ৳{$data['offered_price_bdt']}/কেজি অফার এসেছে। অ্যাপ খুলুন।"
        );

        return $this->created($offer, 'অফার পাঠানো হয়েছে।');
    }

    // GET /api/v1/prices (company market dashboard)
    public function marketPrices(Request $request): JsonResponse
    {
        $cropType = $request->query('crop_type');
        $district = $request->query('district');

        if ($cropType && $district) {
            $trend = $this->pricingService->getPriceTrend($cropType, $district, days: 30);
            return $this->success([
                'trend'   => $trend,
                'current' => $this->pricingService->getCurrentPrice($cropType, $district),
            ]);
        }

        return $this->success($this->pricingService->getDistrictHeatmap());
    }

    // GET /api/v1/offers (company's own submitted offers)
    public function myOffers(Request $request): JsonResponse
    {
        $offers = PurchaseOffer::with(['cropListing.farmer.farmerProfile'])
            ->where('company_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return $this->success($offers);
    }
}
