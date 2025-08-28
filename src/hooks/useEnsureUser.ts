import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Hook to ensure the authenticated user exists in the database
 * This is important for existing Clerk users who signed up before the webhook was configured
 */
export function useEnsureUser() {
  const { user, isLoaded } = useUser();
  const [isUserEnsured, setIsUserEnsured] = useState(false);
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function ensureUserInDatabase() {
      // Only run if user is loaded and authenticated
      if (!isLoaded || !user || isUserEnsured || isEnsuring) {
        return;
      }

      setIsEnsuring(true);
      setError(null);

      try {
        // Call the users API to ensure user exists (this will create them if needed)
        const response = await fetch('/api/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 503) {
          // Database not enabled, that's okay
          console.log('📝 Database not enabled, using SessionStorage mode');
          setIsUserEnsured(true);
          return;
        }

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User ensured in database:', userData.data?.email);
          setIsUserEnsured(true);
        } else if (response.status === 401) {
          // Not authenticated - that's okay, user might not be signed in yet
          console.log('👤 User not authenticated yet');
          setIsUserEnsured(true);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Error ensuring user in database:', errorMessage);
        setError(errorMessage);
        // Don't block the app, just log the error
        setIsUserEnsured(true);
      } finally {
        setIsEnsuring(false);
      }
    }

    ensureUserInDatabase();
  }, [user, isLoaded, isUserEnsured, isEnsuring]);

  return {
    isUserEnsured,
    isEnsuring,
    error,
    // Reset function in case of errors
    retry: () => {
      setIsUserEnsured(false);
      setError(null);
    }
  };
}

/**
 * Component wrapper that ensures user is in database before rendering children
 */
export function UserEnsureWrapper({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isUserEnsured, isEnsuring } = useEnsureUser();

  if (isEnsuring || !isUserEnsured) {
    return fallback || <div className="p-4">Initializing user session...</div>;
  }

  return <>{children}</>;
}