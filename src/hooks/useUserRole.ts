'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export type UserRole = 'user' | 'moderator' | 'admin';

interface UseUserRoleReturn {
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canAccessAdmin: boolean;
  refreshRole: () => void;
}

// Global state to share role across components
let globalUserRole: UserRole | null = null;
let globalIsLoading = false;
let globalError: string | null = null;
let lastFetched = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Subscribers for state updates
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach(callback => callback());
}

async function fetchUserRole(): Promise<void> {
  // Skip if already loading or recently fetched
  if (globalIsLoading || (lastFetched && Date.now() - lastFetched < CACHE_DURATION)) {
    return;
  }

  globalIsLoading = true;
  notifySubscribers();

  try {
    const response = await fetch('/api/users', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated - this is fine
        globalUserRole = null;
        globalError = null;
        lastFetched = Date.now();
        return;
      }
      if (response.status === 503) {
        // Database not enabled - default to user role
        console.warn('⚠️ Database not enabled, defaulting to user role');
        globalUserRole = 'user';
        globalError = null;
        lastFetched = Date.now();
        return;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data) {
      globalUserRole = data.data.role as UserRole;
      globalError = null;
      lastFetched = Date.now();
    } else {
      // Fallback to user role if response is invalid
      console.warn('⚠️ Invalid API response, defaulting to user role');
      globalUserRole = 'user';
      globalError = null;
      lastFetched = Date.now();
    }

  } catch (error) {
    console.error('❌ Error fetching user role:', error);
    // Default to user role on error instead of leaving it null
    globalUserRole = 'user';
    globalError = error instanceof Error ? error.message : 'Unknown error';
    lastFetched = Date.now();
  } finally {
    globalIsLoading = false;
    notifySubscribers();
  }
}

function clearUserRole() {
  globalUserRole = null;
  globalError = null;
  lastFetched = 0;
  notifySubscribers();
}

export function useUserRole(): UseUserRoleReturn {
  const { user: clerkUser, isLoaded } = useUser();
  const [, forceUpdate] = useState({});

  // Force component re-render when global state changes
  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);

  // Subscribe to global state changes
  useEffect(() => {
    subscribers.add(rerender);
    return () => {
      subscribers.delete(rerender);
    };
  }, [rerender]);

  // Fetch role when user logs in, clear when logs out
  useEffect(() => {
    if (!isLoaded) return;

    if (clerkUser) {
      // User is logged in, fetch their role
      fetchUserRole();
    } else {
      // User is logged out, clear role
      clearUserRole();
    }
  }, [clerkUser, isLoaded]);

  const refreshRole = useCallback(() => {
    lastFetched = 0; // Reset cache
    fetchUserRole();
  }, []);

  // Compute derived values
  const isAdmin = globalUserRole === 'admin';
  const isModerator = globalUserRole === 'moderator';
  const canAccessAdmin = isAdmin || isModerator;

  return {
    userRole: globalUserRole,
    isLoading: globalIsLoading,
    isAdmin,
    isModerator,
    canAccessAdmin,
    refreshRole
  };
}

// Convenience hooks for specific checks
export function useIsAdmin(): boolean {
  const { isAdmin } = useUserRole();
  return isAdmin;
}

export function useIsModerator(): boolean {
  const { isModerator } = useUserRole();
  return isModerator;
}

export function useCanAccessAdmin(): boolean {
  const { canAccessAdmin } = useUserRole();
  return canAccessAdmin;
}