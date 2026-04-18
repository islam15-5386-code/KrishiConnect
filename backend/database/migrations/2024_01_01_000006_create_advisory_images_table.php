<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                  ->constrained('advisory_tickets')
                  ->cascadeOnDelete();
            $table->string('image_url')->comment('S3 URL');
            $table->string('original_filename')->nullable();
            $table->unsignedInteger('file_size_bytes')->nullable();
            $table->string('mime_type')->nullable();
            $table->timestamps();

            $table->index('ticket_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_images');
    }
};
