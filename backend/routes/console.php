<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Schedule — KrishiConnect
|--------------------------------------------------------------------------
*/

// Clean up expired/used OTP codes daily at midnight (keeps DB lean)
Schedule::command('model:prune', [
    '--model' => [\App\Models\OtpCode::class],
])->daily();

// Clear expired Sanctum tokens daily
Schedule::command('sanctum:prune-expired', ['--hours' => 24])
         ->daily()
         ->at('02:00');
