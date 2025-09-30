'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRoleStore } from '@/lib/auth/simple-role-store';

export default function RoleFetcher() {
  const { user: clerkUser, isLoaded } = useUser();
  const { fetchUserRole, clearRole } = useRoleStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (clerkUser) {
      // User is logged in, fetch their role
      console.log('👤 User logged in, fetching role...');
      fetchUserRole();
    } else {
      // User is not logged in, clear any stored role
      console.log('👤 User logged out, clearing role...');
      clearRole();
    }
  }, [clerkUser, isLoaded, fetchUserRole, clearRole]);

  return null; // This component doesn't render anything
}