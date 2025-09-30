import { NextRequest } from 'next/server';
import { ensureAuthenticatedUser } from './ensure-user';
import { hasMinimumRole, isAdmin, isModerator } from './roles';
import type { User, UserRole } from '@/lib/db/schema';

/**
 * Simple role-based middleware for API routes
 */

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

/**
 * Require authentication - returns user if authenticated
 */
export async function requireAuth(): Promise<User | Response> {
  const user = await ensureAuthenticatedUser();

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require specific role - returns user if authorized
 */
export async function requireRole(requiredRole: UserRole): Promise<User | Response> {
  const userOrResponse = await requireAuth();

  if (userOrResponse instanceof Response) {
    return userOrResponse;
  }

  const user = userOrResponse as User;

  if (!hasMinimumRole(user, requiredRole)) {
    return new Response(
      JSON.stringify({
        error: 'Insufficient permissions',
        message: `${requiredRole} role required`
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User | Response> {
  return requireRole('admin');
}

/**
 * Require moderator role or higher
 */
export async function requireModerator(): Promise<User | Response> {
  return requireRole('moderator');
}

/**
 * Simple API wrapper for role-based routes
 */
export function withRole<T extends any[]>(
  requiredRole: UserRole,
  handler: (user: User, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const userOrResponse = await requireRole(requiredRole);

      if (userOrResponse instanceof Response) {
        return userOrResponse;
      }

      return handler(userOrResponse as User, ...args);
    } catch (error) {
      console.error('❌ Role middleware error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: 'Authentication system error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Admin-only route wrapper
 */
export function withAdmin<T extends any[]>(
  handler: (user: User, ...args: T) => Promise<Response>
) {
  return withRole('admin', handler);
}

/**
 * Moderator-only route wrapper
 */
export function withModerator<T extends any[]>(
  handler: (user: User, ...args: T) => Promise<Response>
) {
  return withRole('moderator', handler);
}

/**
 * Check user permissions without throwing
 */
export async function checkPermissions(requiredRole?: UserRole) {
  const user = await ensureAuthenticatedUser();

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user ? isAdmin(user) : false,
    isModerator: user ? isModerator(user) : false,
    hasRequiredRole: user && requiredRole ? hasMinimumRole(user, requiredRole) : true,
  };
}