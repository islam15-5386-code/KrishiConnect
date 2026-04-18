<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Notify farmer and vendor when order status changes.
     *
     * Status transitions: pending → confirmed → dispatched → delivered | cancelled
     */
    public function updated(Order $order): void
    {
        if (!$order->wasChanged('status')) {
            return;
        }

        $oldStatus = $order->getOriginal('status');
        $newStatus = $order->status;

        Log::info("OrderObserver: Order #{$order->id} status: {$oldStatus} → {$newStatus}");

        // Notify farmer of status change
        [$farmerTitle, $farmerBody] = $this->getFarmerMessage($order, $newStatus);
        if ($farmerTitle) {
            $this->notificationService->sendPush(
                user: $order->farmer,
                title: $farmerTitle,
                body: $farmerBody,
                data: ['type' => 'order_status', 'order_id' => $order->id, 'status' => $newStatus]
            );
        }

        // Notify vendor when order is placed (pending state created)
        if ($newStatus === 'confirmed') {
            $this->notificationService->sendPush(
                user: $order->vendor,
                title: '📦 অর্ডার নিশ্চিত হয়েছে',
                body: "অর্ডার #{$order->id} নিশ্চিত করা হয়েছে। ডেলিভারি প্রস্তুত করুন।",
                data: ['type' => 'order_confirmed', 'order_id' => $order->id]
            );
        }
    }

    /**
     * Notify vendor the moment a new order arrives (status: pending).
     */
    public function created(Order $order): void
    {
        $this->notificationService->sendPush(
            user: $order->vendor,
            title: '🛒 নতুন অর্ডার পাওয়া গেছে',
            body: "কৃষক একটি নতুন অর্ডার দিয়েছেন। মোট: ৳{$order->total_bdt}",
            data: ['type' => 'new_order', 'order_id' => $order->id]
        );
    }

    private function getFarmerMessage(Order $order, string $status): array
    {
        return match ($status) {
            'confirmed'  => ['✅ অর্ডার নিশ্চিত হয়েছে', "আপনার অর্ডার #{$order->id} বিক্রেতা নিশ্চিত করেছেন।"],
            'dispatched' => ['🚚 অর্ডার পাঠানো হয়েছে', "আপনার অর্ডার #{$order->id} রওনা দিয়েছে।"],
            'delivered'  => ['🎉 অর্ডার পৌঁছে গেছে', "অর্ডার #{$order->id} সফলভাবে ডেলিভারি হয়েছে।"],
            'cancelled'  => ['❌ অর্ডার বাতিল হয়েছে', "অর্ডার #{$order->id} বাতিল করা হয়েছে।"],
            default      => [null, null],
        };
    }
}
