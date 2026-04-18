<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('crop_type')
                  ->comment('e.g. ধান, পাট, সবজি, মাছ');
            $table->decimal('quantity_kg', 10, 2);
            $table->enum('quality_grade', ['A', 'B', 'C'])
                  ->comment('A=Premium, B=Standard, C=Economy');
            $table->decimal('asking_price_bdt', 12, 2)
                  ->comment('Per kg asking price');
            $table->string('location_district');
            $table->string('location_upazila')->nullable();
            $table->date('harvest_date')->nullable();
            $table->text('description')->nullable();
            // JSON array of S3 photo URLs
            $table->json('photos')->nullable();
            $table->enum('status', ['available', 'negotiating', 'sold'])
                  ->default('available');
            // Denormalized for quick comparison display
            $table->decimal('market_benchmark_price', 12, 2)->nullable()
                  ->comment('Market price at listing time for benchmark display');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'crop_type', 'location_district']);
            $table->index('farmer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_listings');
    }
};
