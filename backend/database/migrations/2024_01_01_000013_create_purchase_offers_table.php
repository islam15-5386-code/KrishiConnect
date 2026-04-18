<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_listing_id')
                  ->constrained('crop_listings')
                  ->cascadeOnDelete();
            $table->foreignId('company_id')
                  ->constrained('users')
                  ->cascadeOnDelete()
                  ->comment('The agri-company making the offer');
            $table->decimal('offered_price_bdt', 12, 2)
                  ->comment('Offered price per kg');
            $table->decimal('quantity_kg', 10, 2)
                  ->comment('Quantity offered to purchase');
            $table->text('pickup_logistics')->nullable()
                  ->comment('Who arranges transport, address, schedule');
            $table->enum('status', ['pending', 'countered', 'accepted', 'rejected'])
                  ->default('pending');
            // JSON log: [{actor, price, note, timestamp}, ...]
            $table->json('negotiation_history')->nullable()
                  ->comment('Full negotiation trail for audit and UX');
            $table->decimal('counter_price_bdt', 12, 2)->nullable()
                  ->comment('Farmer counter-offer price');
            $table->timestamp('expires_at')->nullable()
                  ->comment('Offer expiry time set by company');
            $table->timestamps();

            $table->index(['crop_listing_id', 'status']);
            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_offers');
    }
};
