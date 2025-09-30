import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  useUser as useStoreUser,
  useUserRole,
  useIsAdmin,
  useIsModerator,
  useCanAccessAdmin,
  useAuthLoading,
  useAuthInitialized
} from '@/stores/simple-auth-store';

export interface AdminRoleInfo {
  role: 'user' | 'moderator' | 'admin' | null;
  isAdmin: boolean;
  isModerator: boolean;
  hasAdminAccess: boolean;
  loading: boolean;
  hydrated: boolean;
}

export function useAdminRole(): AdminRoleInfo {
  const { user: clerkUser, isLoaded } = useUser();
  const [hydrated, setHydrated] = useState(false);

  // Use simple auth store for role information
  const storeUser = useStoreUser();
  const userRole = useUserRole();
  const isAdmin = useIsAdmin();
  const isModerator = useIsModerator();
  const canAccessAdmin = useCanAccessAdmin();
  const authLoading = useAuthLoading();
  const authInitialized = useAuthInitialized();

  // Handle hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Determine loading state
  const loading = !isLoaded || !hydrated || !authInitialized || authLoading;


  // Return role info based on simple auth store
  if (!hydrated || !isLoaded) {
    return {
      role: null,
      isAdmin: false,
      isModerator: false,
      hasAdminAccess: false,
      loading: true,
      hydrated: false,
    };
  }

  if (!clerkUser) {
    return {
      role: null,
      isAdmin: false,
      isModerator: false,
      hasAdminAccess: false,
      loading: false,
      hydrated: true,
    };
  }

  return {
    role: userRole,
    isAdmin,
    isModerator,
    hasAdminAccess: canAccessAdmin,
    loading,
    hydrated: true,
  };
}