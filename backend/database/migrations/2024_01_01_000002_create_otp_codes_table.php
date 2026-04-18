<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            // Store phone hash (not raw number) for privacy
            $table->string('phone_hash')->index()->comment('SHA-256 hash of the phone number');
            $table->string('code', 6)->comment('6-digit OTP');
            $table->string('purpose')->default('login')->comment('login|register');
            $table->timestamp('expires_at');
            $table->boolean('is_used')->default(false);
            $table->unsignedTinyInteger('attempts')->default(0)->comment('Wrong attempt count, max 3');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['phone_hash', 'is_used', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
