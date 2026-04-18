<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS Configuration — KrishiConnect
    | Whitelist: Next.js dashboard origin + React Native Expo origin only
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Explicitly whitelist only known origins (Section 8 requirement)
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,exp://localhost:19000'
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],

    'max_age' => 86400, // 24-hour preflight cache

    'supports_credentials' => true,
];
