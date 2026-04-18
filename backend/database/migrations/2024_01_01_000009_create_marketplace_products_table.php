<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('name');
            $table->string('category')
                  ->comment('Fertilizer, Pesticide, Seed, Tool, Equipment, Other');
            $table->text('description')->nullable();
            $table->decimal('price_bdt', 12, 2);
            $table->unsignedInteger('stock_quantity')->default(0);
            // JSON array of S3 image URLs
            $table->json('images')->nullable();
            // JSON array: ["BADC Certified", "Organic"]
            $table->json('certifications')->nullable();
            $table->boolean('is_approved')->default(false)
                  ->comment('Admin must approve before visible to farmers');
            $table->boolean('is_active')->default(true);
            $table->string('unit')->default('piece')
                  ->comment('piece, kg, litre, packet');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_approved', 'is_active', 'category']);
            $table->index('vendor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_products');
    }
};
