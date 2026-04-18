<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                  ->constrained('advisory_tickets')
                  ->cascadeOnDelete();
            $table->foreignId('officer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->text('response_text');
            // JSON array of product recommendations: [{name, category, dosage}]
            $table->json('recommended_products')->nullable();
            // e.g. "3-7 days", "2 weeks"
            $table->string('resolution_timeline')->nullable();
            $table->boolean('is_visible_to_farmer')->default(true);
            $table->timestamps();

            $table->index(['ticket_id', 'officer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_responses');
    }
};
