<?php

namespace App\Providers;

use App\Models\AdvisoryTicket;
use App\Models\Order;
use App\Observers\OrderObserver;
use App\Observers\TicketObserver;
use App\Services\AdvisoryRoutingService;
use App\Services\NotificationService;
use App\Services\PricingService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     * Bind service classes as singletons so they share Redis connections.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationService::class);
        $this->app->singleton(PricingService::class);
        $this->app->singleton(AdvisoryRoutingService::class, function ($app) {
            return new AdvisoryRoutingService(
                $app->make(NotificationService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     * Register Eloquent observers for automatic side-effects.
     */
    public function boot(): void
    {
        // Auto-assign officer when ticket is created (TicketObserver::created)
        AdvisoryTicket::observe(TicketObserver::class);

        // Notify farmer/vendor on order status changes (OrderObserver::updated/created)
        Order::observe(OrderObserver::class);
    }
}
