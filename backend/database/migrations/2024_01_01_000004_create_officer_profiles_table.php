<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
            $table->string('full_name');
            $table->string('employee_id')->unique();
            $table->string('division');
            $table->string('district')->comment('Primary coverage district');
            $table->string('upazila')->nullable();
            $table->string('specialization')->nullable()->comment('Paddy, Jute, Fisheries, etc.');
            $table->string('profile_photo_url')->nullable();
            $table->timestamps();

            $table->index('district');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_profiles');
    }
};
