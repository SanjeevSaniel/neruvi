import { auth, currentUser } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';
import { getInitialUserRole } from './roles';
import type { User } from '@/lib/db/schema';

/**
 * Ensures that the authenticated user exists in the database
 * Creates the user if they don't exist (for existing Clerk users)
 * Returns null if no user is authenticated or database is disabled
 */
export async function ensureAuthenticatedUser(): Promise<User | null> {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return null;
    }

    // Get authenticated user from Clerk
    const { userId } = await auth();
    if (!userId) {
      return null; // Not authenticated
    }

    const dbService = new DatabaseService();
    
    // Check if user exists in database
    let user = await dbService.getUserByClerkId(userId);
    
    if (!user) {
      // User doesn't exist in database - create them
      console.log(`🔧 Auto-creating missing user for Clerk ID: ${userId}`);
      
      const clerkUser = await currentUser();
      if (!clerkUser) {
        console.error('❌ Could not get Clerk user data');
        return null;
      }

      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
      if (!primaryEmail) {
        console.error('❌ No primary email found for user');
        return null;
      }

      // Create display name
      const displayName = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || clerkUser.firstName || 'User';

      // Determine user role
      const userRole = getInitialUserRole(primaryEmail);

      // Create user in database
      user = await dbService.createOrUpdateUser(
        userId,
        primaryEmail,
        displayName,
        userRole
      );

      console.log(`✅ Auto-created user: ${user.email} (${user.role})`);
    }

    return user;

  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    return null;
  }
}

/**
 * Middleware wrapper for API routes to ensure user exists
 */
export async function withEnsuredUser<T>(
  handler: (user: User) => Promise<T>
): Promise<T | Response> {
  const user = await ensureAuthenticatedUser();
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found or not authenticated' }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  return handler(user);
}

/**
 * Higher-order function for API routes that need authenticated users
 */
export function apiWithUser<T extends any[]>(
  handler: (user: User, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const user = await ensureAuthenticatedUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required',
            message: 'User not found in database. Please contact support if this persists.'
          }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      return handler(user, ...args);
    } catch (error) {
      console.error('❌ API authentication error:', error);
      
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