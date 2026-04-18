<?php

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\OtpRateLimiter;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Apply ForceJsonResponse to all API routes
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Register named middleware aliases for route declarations
        $middleware->alias([
            'role'            => RoleMiddleware::class,
            'otp.rate_limit'  => OtpRateLimiter::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return consistent JSON envelope for 404s on API routes
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                    'data'    => null,
                    'errors'  => [],
                ], 404);
            }
        });

        // Return JSON for wrong HTTP method errors
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Method not allowed.',
                    'data'    => null,
                    'errors'  => [],
                ], 405);
            }
        });

        // Catch-all: return JSON for any unhandled exception on API routes
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') && !config('app.debug')) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred.',
                    'data'    => null,
                    'errors'  => [],
                ], 500);
            }
        });
    })
    ->create();
