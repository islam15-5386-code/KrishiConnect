<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // AES-256 encrypted at rest — stored as text to hold encrypted value
            $table->string('phone_number')->unique()->comment('Stored AES-256 encrypted');
            $table->string('phone_hash')->unique()->comment('SHA-256 hash for lookup without decryption');
            $table->enum('role', ['farmer', 'agricultural_officer', 'company', 'vendor', 'admin'])
                  ->default('farmer');
            $table->boolean('is_verified')->default(false);
            $table->string('fcm_token')->nullable()->comment('Firebase FCM device token');
            $table->enum('preferred_language', ['bn', 'en'])->default('bn');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('role');
            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
