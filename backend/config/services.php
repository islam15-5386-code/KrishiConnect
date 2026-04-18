<?php

return [
    'fcm' => [
        'project_id'           => env('FCM_PROJECT_ID'),
        'service_account_json' => env('FCM_SERVICE_ACCOUNT_JSON'),
    ],

    's3' => [
        'key'                     => env('AWS_ACCESS_KEY_ID'),
        'secret'                  => env('AWS_SECRET_ACCESS_KEY'),
        'region'                  => env('AWS_DEFAULT_REGION', 'ap-southeast-1'),
        'bucket'                  => env('AWS_BUCKET'),
        'url'                     => env('AWS_URL'),
        'endpoint'                => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    ],

    'sslcommerz' => [
        'store_id'           => env('SSLCOMMERZ_STORE_ID'),
        'store_password'     => env('SSLCOMMERZ_STORE_PASSWORD'),
        'is_sandbox'         => (bool) env('SSLCOMMERZ_IS_SANDBOX', true),
        'sandbox_api_url'    => env('SSLCOMMERZ_SANDBOX_API_URL', 'https://sandbox.sslcommerz.com'),
        'production_api_url' => env('SSLCOMMERZ_PRODUCTION_API_URL', 'https://securepay.sslcommerz.com'),
    ],

    'ssl_wireless_sms' => [
        'api_url'   => env('SSL_WIRELESS_API_URL', 'https://sms.sslwireless.com/pushapi/dynamic/server.php'),
        'user'      => env('SSL_WIRELESS_USER'),
        'pass'      => env('SSL_WIRELESS_PASS'),
        'sender_id' => env('SSL_WIRELESS_SENDER_ID', 'KrishiCon'),
    ],
];
