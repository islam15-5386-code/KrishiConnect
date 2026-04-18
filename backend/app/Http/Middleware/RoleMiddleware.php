<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage: Route::middleware(['auth:sanctum', 'role:farmer'])
     *        Route::middleware(['auth:sanctum', 'role:admin,agricultural_officer'])
     *
     * @param string $roles Comma-separated list of allowed roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'data'    => null,
                'errors'  => [],
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Check users.role against the middleware allowed roles array.
        $allowedRoles = array_filter($roles);
        if (!empty($allowedRoles) && !in_array((string) $user->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to access this resource.',
                'data'    => null,
                'errors'  => ['role' => 'Required role(s): ' . implode(', ', $allowedRoles)],
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
