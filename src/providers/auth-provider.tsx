'use client';

import { useEffect, useRef } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { useSimpleAuthStore } from '@/stores/simple-auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useClerkUser();
  const {
    fetchUserData,
    syncUserData,
    reset,
    isInitialized,
    setInitialized,
    error
  } = useSimpleAuthStore();
  const retryCountRef = useRef(0);
  const syncAttemptedRef = useRef(false);
  const maxRetries = 3;

  useEffect(() => {

    // Wait for Clerk to load
    if (!clerkIsLoaded) {
      return;
    }

    if (clerkUser) {

      // User is signed in with Clerk, fetch our user data immediately
      if (!isInitialized) {
        if (error && retryCountRef.current >= maxRetries) {

          // Try sync method as fallback (using client-side data)
          if (!syncAttemptedRef.current) {
            syncAttemptedRef.current = true;
            const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
            const displayName = clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.username || '';
            const imageUrl = clerkUser.imageUrl || '';

            syncUserData(clerkUser.id, email, displayName, imageUrl);
          } else {
            setInitialized(true); // Give up and mark as initialized to prevent infinite loops
          }
        } else {
          retryCountRef.current += 1;
          fetchUserData();
        }
      } else {
        retryCountRef.current = 0; // Reset retry count on success
        syncAttemptedRef.current = false; // Reset sync attempt flag
      }
    } else {
      // User is not signed in, reset auth store
      retryCountRef.current = 0; // Reset retry count
      syncAttemptedRef.current = false; // Reset sync attempt flag
      reset();
      setInitialized(true);
    }
  }, [clerkUser, clerkIsLoaded, fetchUserData, syncUserData, reset, isInitialized, setInitialized, error]);

  return <>{children}</>;
}

// Hook to check if auth is ready
export const useAuthReady = () => {
  const { isLoaded: clerkIsLoaded } = useClerkUser();
  const isInitialized = useSimpleAuthStore((state) => state.isInitialized);

  return clerkIsLoaded && isInitialized;
};