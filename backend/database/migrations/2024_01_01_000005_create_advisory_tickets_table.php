<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')
                  ->constrained('users')
                  ->cascadeOnDelete()
                  ->comment('Farmer who submitted the ticket');
            $table->foreignId('assigned_officer_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->comment('Agricultural officer assigned to this ticket');
            $table->string('title');
            $table->text('description');
            $table->string('crop_type')->comment('e.g. ধান, পাট, সবজি');
            $table->enum('status', ['open', 'assigned', 'resolved', 'escalated'])
                  ->default('open');
            $table->string('district')->comment('Farmer district — used for officer routing');
            $table->string('division')->nullable();
            // Track when officer was assigned for SLA monitoring
            $table->timestamp('assigned_at')->nullable();
            // Track when ticket was resolved
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'district']);
            $table->index(['assigned_officer_id', 'status']);
            $table->index('farmer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_tickets');
    }
};
