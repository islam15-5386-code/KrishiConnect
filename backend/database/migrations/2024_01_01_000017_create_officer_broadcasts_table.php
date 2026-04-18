<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('officer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('district')
                  ->comment('Target district for the broadcast');
            $table->string('crop_type')->nullable()
                  ->comment('Optional: target specific crop farmers only');
            $table->enum('channel', ['push', 'sms', 'both'])->default('both');
            $table->unsignedInteger('sent_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['district', 'crop_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_broadcasts');
    }
};
