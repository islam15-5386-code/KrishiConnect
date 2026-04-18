<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farmer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
            $table->string('full_name');
            $table->string('division');
            $table->string('district');
            $table->string('upazila');
            $table->decimal('land_size_acres', 8, 2)->default(0);
            // JSON array of crop names: ["ধান", "পাট", "সবজি"]
            $table->json('primary_crops')->nullable();
            $table->string('profile_photo_url')->nullable();
            // Stored encrypted (AES-256), nullable for optional verification
            $table->string('national_id')->nullable()->comment('AES-256 encrypted');
            $table->timestamps();

            $table->index(['district', 'division']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farmer_profiles');
    }
};
