<?php

namespace App\Http\Controllers\API\v1\Farmer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Farmer\CheckoutRequest;
use App\Models\MarketplaceProduct;
use App\Models\Order;
use App\Models\OrderItem;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MarketplaceController extends Controller
{
    use ApiResponse;

    // GET /api/v1/marketplace/products
    public function index(Request $request): JsonResponse
    {
        $products = MarketplaceProduct::approved()
            ->inStock()
            ->byCategory($request->query('category'))
            ->when($request->query('min_price'), fn($q) => $q->where('price_bdt', '>=', $request->query('min_price')))
            ->when($request->query('max_price'), fn($q) => $q->where('price_bdt', '<=', $request->query('max_price')))
            ->with('vendor')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->success($products);
    }

    // POST /api/v1/marketplace/cart/checkout
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $order = DB::transaction(function () use ($user, $data) {
            $totalBdt = 0;
            $vendorId = null;
            $items    = [];

            foreach ($data['items'] as $item) {
                $product = MarketplaceProduct::approved()->lockForUpdate()->findOrFail($item['product_id']);

                // All items must be from the same vendor in one order
                if ($vendorId && $vendorId !== $product->vendor_id) {
                    throw new \RuntimeException('এক অর্ডারে একাধিক বিক্রেতার পণ্য নেওয়া যাবে না।');
                }
                $vendorId = $product->vendor_id;

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \RuntimeException("'{$product->name}' পর্যাপ্ত স্টক নেই।");
                }

                $product->decrement('stock_quantity', $item['quantity']);

                $subtotal  = $item['quantity'] * $product->price_bdt;
                $totalBdt += $subtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price_bdt,
                ];
            }

            $order = Order::create([
                'farmer_id'        => $user->id,
                'vendor_id'        => $vendorId,
                'status'           => 'pending',
                'delivery_address' => $data['delivery_address'],
                'delivery_district'=> $data['delivery_district'] ?? null,
                'payment_method'   => $data['payment_method'],
                'payment_status'   => 'unpaid',
                'total_bdt'        => $totalBdt,
                'delivery_charge_bdt' => $data['delivery_charge_bdt'] ?? 0,
            ]);

            foreach ($items as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
            }

            return $order;
        });

        // OrderObserver::created() notifies vendor automatically
        return $this->created($order->load('items.product'), 'অর্ডার সফলভাবে দেওয়া হয়েছে।');
    }

    // GET /api/v1/orders
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.product', 'vendor'])
            ->where('farmer_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        return $this->success($orders);
    }
}
