<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('vendor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'])
                  ->default('pending');
            $table->text('delivery_address');
            $table->string('delivery_district')->nullable();
            $table->enum('payment_method', ['bkash', 'nagad', 'sslcommerz', 'cod'])
                  ->default('cod');
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded', 'failed'])
                  ->default('unpaid');
            $table->string('payment_transaction_id')->nullable();
            $table->decimal('total_bdt', 12, 2);
            $table->decimal('delivery_charge_bdt', 8, 2)->default(0);
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['farmer_id', 'status']);
            $table->index(['vendor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
