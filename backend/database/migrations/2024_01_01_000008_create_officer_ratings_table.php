<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                  ->constrained('advisory_tickets')
                  ->cascadeOnDelete();
            $table->foreignId('farmer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('officer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            // 1 to 5 stars
            $table->unsignedTinyInteger('rating')
                  ->comment('1-5 star rating');
            $table->text('feedback')->nullable();
            $table->timestamps();

            // One rating per ticket per farmer
            $table->unique(['ticket_id', 'farmer_id']);
            $table->index('officer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_ratings');
    }
};
