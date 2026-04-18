<?php

namespace App\Http\Controllers\API\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdvisoryTicket;
use App\Models\MarketplaceProduct;
use App\Models\Order;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    use ApiResponse;

    // GET /api/v1/admin/users
    public function users(Request $request): JsonResponse
    {
        $users = User::with(['farmerProfile', 'officerProfile'])
            ->when($request->query('role'), fn($q) => $q->where('role', $request->query('role')))
            ->when($request->query('search'), fn($q) =>
                $q->where('phone_hash', hash('sha256', $request->query('search')))
            )
            ->when($request->query('verified') !== null, fn($q) =>
                $q->where('is_verified', $request->boolean('verified'))
            )
            ->latest()
            ->paginate(25);

        return $this->success($users);
    }

    // PATCH /api/v1/admin/users/{id}/verify
    public function verifyUser(Request $request, int $id): JsonResponse
    {
        $user   = User::findOrFail($id);
        $action = $request->input('action', 'verify'); // verify | suspend | activate

        match ($action) {
            'verify'   => $user->update(['is_verified' => true]),
            'suspend'  => $user->update(['is_active' => false]),
            'activate' => $user->update(['is_active' => true]),
        };

        return $this->success(['user_id' => $id, 'action' => $action], 'ব্যবহারকারীর স্ট্যাটাস আপডেট হয়েছে।');
    }

    // DELETE /api/v1/admin/products/{id}
    public function deleteProduct(int $id): JsonResponse
    {
        $product = MarketplaceProduct::findOrFail($id);
        $product->delete(); // Soft delete

        return $this->success(null, 'পণ্য মুছে ফেলা হয়েছে।');
    }

    // PATCH /api/v1/admin/products/{id}/approve
    public function approveProduct(int $id): JsonResponse
    {
        $product = MarketplaceProduct::findOrFail($id);
        $product->update(['is_approved' => true]);

        return $this->success(null, 'পণ্য অনুমোদিত হয়েছে।');
    }

    // GET /api/v1/admin/analytics/overview
    public function analyticsOverview(): JsonResponse
    {
        $overview = Cache::remember('admin_analytics_overview', 300, function () {
            $thirtyDaysAgo = now()->subDays(30);

            return [
                // Platform KPIs
                'mau' => User::where('last_login_at', '>=', now()->subDays(30))->count(),
                'total_users' => [
                    'farmers'  => User::where('role', 'farmer')->count(),
                    'officers' => User::where('role', 'agricultural_officer')->count(),
                    'companies'=> User::where('role', 'company')->count(),
                    'vendors'  => User::where('role', 'vendor')->count(),
                ],
                // Ticket resolution rate
                'tickets' => [
                    'total'     => AdvisoryTicket::count(),
                    'resolved'  => AdvisoryTicket::where('status', 'resolved')->count(),
                    'open'      => AdvisoryTicket::where('status', 'open')->count(),
                    'escalated' => AdvisoryTicket::where('status', 'escalated')->count(),
                    'resolution_rate' => AdvisoryTicket::count() > 0
                        ? round(AdvisoryTicket::where('status', 'resolved')->count() / AdvisoryTicket::count() * 100, 1)
                        : 0,
                ],
                // Gross Merchandise Value
                'gmv' => [
                    'total_bdt'        => Order::where('status', 'delivered')->sum('total_bdt'),
                    'last_30_days_bdt' => Order::where('status', 'delivered')
                                               ->where('created_at', '>=', $thirtyDaysAgo)
                                               ->sum('total_bdt'),
                    'total_orders'     => Order::count(),
                ],
                // Marketplace
                'products' => [
                    'total'    => MarketplaceProduct::count(),
                    'pending_approval' => MarketplaceProduct::where('is_approved', false)->count(),
                ],
            ];
        });

        return $this->success($overview);
    }

    // GET /api/v1/health
    public function health(): JsonResponse
    {
        return response()->json([
            'success'   => true,
            'status'    => 'ok',
            'timestamp' => now()->toIso8601String(),
            'version'   => config('app.version', '1.0.0'),
        ]);
    }
}
