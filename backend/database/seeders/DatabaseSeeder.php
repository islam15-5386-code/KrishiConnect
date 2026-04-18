<?php

namespace Database\Seeders;

use App\Models\AdvisoryImage;
use App\Models\AdvisoryResponse;
use App\Models\AdvisoryTicket;
use App\Models\AuditLog;
use App\Models\CropListing;
use App\Models\FarmerProfile;
use App\Models\MarketplaceProduct;
use App\Models\OfficerRating;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PriceTracking;
use App\Models\PurchaseOffer;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->admin()->create([
            'phone_number' => '+8801700000000',
            'preferred_language' => 'en',
        ]);

        $farmers = User::factory()->count(10)->farmer()->create();
        $officers = User::factory()->count(5)->officer()->create();
        $companies = User::factory()->count(3)->company()->create();
        $vendors = User::factory()->count(3)->vendor()->create();

        $farmers->each(function (User $farmer): void {
            FarmerProfile::factory()->create(['user_id' => $farmer->id]);
        });

        $tickets = collect();
        $farmers->each(function (User $farmer) use ($officers, &$tickets): void {
            $farmerTickets = AdvisoryTicket::factory()->count(2)->create([
                'farmer_id' => $farmer->id,
                'assigned_officer_id' => $officers->random()->id,
                'status' => 'assigned',
                'assigned_at' => now()->subHours(rand(2, 48)),
            ]);

            $tickets = $tickets->merge($farmerTickets);
        });

        $tickets->each(function (AdvisoryTicket $ticket): void {
            AdvisoryImage::factory()->count(rand(1, 3))->create([
                'ticket_id' => $ticket->id,
            ]);
        });

        $resolvedTickets = $tickets->random(min(10, $tickets->count()));
        $resolvedTickets->each(function (AdvisoryTicket $ticket): void {
            AdvisoryResponse::factory()->create([
                'ticket_id' => $ticket->id,
                'officer_id' => $ticket->assigned_officer_id,
            ]);

            $ticket->update([
                'status' => 'resolved',
                'resolved_at' => now()->subHours(rand(1, 24)),
            ]);

            OfficerRating::factory()->create([
                'ticket_id' => $ticket->id,
                'farmer_id' => $ticket->farmer_id,
                'officer_id' => $ticket->assigned_officer_id,
            ]);
        });

        $vendorProducts = collect();
        $vendors->each(function (User $vendor) use (&$vendorProducts): void {
            $products = MarketplaceProduct::factory()->count(4)->create([
                'vendor_id' => $vendor->id,
            ]);

            $vendorProducts = $vendorProducts->merge($products);
        });

        $orders = collect();
        $farmers->each(function (User $farmer) use ($vendors, $vendorProducts, &$orders): void {
            $vendor = $vendors->random();
            $order = Order::factory()->create([
                'farmer_id' => $farmer->id,
                'vendor_id' => $vendor->id,
                'status' => collect(['pending', 'confirmed', 'dispatched', 'delivered'])->random(),
            ]);

            $products = $vendorProducts->where('vendor_id', $vendor->id)->shuffle()->take(rand(1, 3));
            foreach ($products as $product) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => rand(1, 4),
                    'unit_price' => $product->price_bdt,
                ]);
            }

            $computedTotal = (float) $order->items()->selectRaw('COALESCE(SUM(quantity * unit_price),0) as total')->value('total');
            $order->update(['total_bdt' => $computedTotal + (float) $order->delivery_charge_bdt]);

            $orders->push($order);
        });

        $cropListings = collect();
        $farmers->each(function (User $farmer) use (&$cropListings): void {
            $listings = CropListing::factory()->count(2)->create([
                'farmer_id' => $farmer->id,
            ]);

            $cropListings = $cropListings->merge($listings);
        });

        $cropListings->take(12)->each(function (CropListing $listing) use ($companies): void {
            $companies->shuffle()->take(rand(1, 3))->each(function (User $company) use ($listing): void {
                PurchaseOffer::factory()->create([
                    'crop_listing_id' => $listing->id,
                    'company_id' => $company->id,
                ]);
            });
        });

        PriceTracking::factory()->count(40)->create();

        User::query()->select('id', 'phone_hash')->get()->each(function (User $user): void {
            AuditLog::factory()->count(rand(1, 3))->create([
                'user_id' => $user->id,
                'phone_hash' => $user->phone_hash,
            ]);
        });

        AuditLog::factory()->create([
            'user_id' => $admin->id,
            'event' => 'seed_completed',
            'metadata' => [
                'farmers' => 10,
                'officers' => 5,
                'companies' => 3,
                'vendors' => 3,
                'admins' => 1,
            ],
        ]);
    }
}
