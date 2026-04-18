<?php

namespace App\Http\Controllers\API\v1\Vendor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\CreateProductRequest;
use App\Http\Requests\Vendor\UpdateOrderStatusRequest;
use App\Models\MarketplaceProduct;
use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VendorController extends Controller
{
    use ApiResponse;

    // POST /api/v1/vendor/products
    public function createProduct(CreateProductRequest $request): JsonResponse
    {
        $vendor = $request->user();
        $data   = $request->validated();

        $imageUrls = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path        = $image->store("products/{$vendor->id}", 's3');
                $imageUrls[] = Storage::disk('s3')->url($path);
            }
        }

        $product = MarketplaceProduct::create([
            'vendor_id'      => $vendor->id,
            'name'           => $data['name'],
            'category'       => $data['category'],
            'description'    => $data['description'] ?? null,
            'price_bdt'      => $data['price_bdt'],
            'stock_quantity' => $data['stock_quantity'],
            'unit'           => $data['unit'] ?? 'piece',
            'images'         => $imageUrls,
            'certifications' => $data['certifications'] ?? [],
            'is_approved'    => false, // Requires admin approval
        ]);

        return $this->created(
            $product,
            'পণ্য জমা হয়েছে। অ্যাডমিন অনুমোদনের পর দৃশ্যমান হবে।'
        );
    }

    // GET /api/v1/vendor/orders
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.product', 'farmer.farmerProfile'])
            ->where('vendor_id', $request->user()->id)
            ->byStatus($request->query('status'))
            ->latest()
            ->paginate(20);

        return $this->success($orders);
    }

    // PATCH /api/v1/vendor/orders/{id}/status
    public function updateOrderStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        $vendor = $request->user();
        $order  = Order::where('vendor_id', $vendor->id)->findOrFail($id);
        $data   = $request->validated();

        // Validate transition: can only move forward, not backward
        $allowedTransitions = [
            'pending'    => ['confirmed', 'cancelled'],
            'confirmed'  => ['dispatched', 'cancelled'],
            'dispatched' => ['delivered'],
        ];

        $currentStatus = $order->status;
        $newStatus     = $data['status'];

        if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [])) {
            return $this->error(
                "'{$currentStatus}' থেকে '{$newStatus}' এ পরিবর্তন করা যাবে না।",
                ['allowed' => $allowedTransitions[$currentStatus] ?? []]
            );
        }

        $updateData = ['status' => $newStatus];
        if ($newStatus === 'dispatched') $updateData['dispatched_at'] = now();
        if ($newStatus === 'delivered')  $updateData['delivered_at']  = now();
        if ($newStatus === 'cancelled')  $updateData['cancellation_reason'] = $data['cancellation_reason'] ?? null;

        $order->update($updateData);
        // OrderObserver::updated() sends push notifications to farmer automatically

        return $this->success($order->fresh(), 'অর্ডার স্ট্যাটাস আপডেট হয়েছে।');
    }
}
