<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_tracking', function (Blueprint $table) {
            $table->id();
            $table->string('crop_type');
            $table->string('region_district');
            $table->string('region_division')->nullable();
            $table->decimal('price_bdt_per_kg', 10, 2);
            $table->timestamp('recorded_at');
            $table->string('source')->default('manual')
                  ->comment('manual, DAE, scraped, market_report');
            $table->string('quality_grade')->nullable()
                  ->comment('A, B, C or null for average');
            $table->timestamps();

            // Composite index for the PricingService lookup
            $table->index(['crop_type', 'region_district', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_tracking');
    }
};
