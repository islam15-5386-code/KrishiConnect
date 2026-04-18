<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::prefix('public')->group(function () {
        Route::get('/health', fn () => response()->json(['success' => true, 'message' => 'OK']));
        Route::post('/auth/send-otp', fn (Request $request) => response()->json([
            'success' => true,
            'message' => 'OTP request accepted.',
            'phone' => $request->input('phone_number'),
        ]))->middleware('otp.rate_limit');
        Route::post('/auth/verify-otp', fn () => response()->json(['success' => true, 'message' => 'OTP verified.']));
    });

    // Farmer routes
    Route::prefix('farmer')->middleware(['auth:sanctum', 'role:farmer'])->group(function () {
        Route::get('/dashboard', fn (Request $request) => response()->json([
            'success' => true,
            'role' => 'farmer',
            'user_id' => optional($request->user())->id,
        ]));
    });

    // Officer routes
    Route::prefix('officer')->middleware(['auth:sanctum', 'role:agricultural_officer,officer'])->group(function () {
        Route::get('/dashboard', fn (Request $request) => response()->json([
            'success' => true,
            'role' => 'officer',
            'user_id' => optional($request->user())->id,
        ]));
    });

    // Company routes
    Route::prefix('company')->middleware(['auth:sanctum', 'role:company'])->group(function () {
        Route::get('/dashboard', fn (Request $request) => response()->json([
            'success' => true,
            'role' => 'company',
            'user_id' => optional($request->user())->id,
        ]));
    });

    // Vendor routes
    Route::prefix('vendor')->middleware(['auth:sanctum', 'role:vendor'])->group(function () {
        Route::get('/dashboard', fn (Request $request) => response()->json([
            'success' => true,
            'role' => 'vendor',
            'user_id' => optional($request->user())->id,
        ]));
    });

    // Admin routes
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/dashboard', fn (Request $request) => response()->json([
            'success' => true,
            'role' => 'admin',
            'user_id' => optional($request->user())->id,
        ]));
    });
});
