'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Use replace to avoid back button issues
      router.replace('/chat');
    }
  }, [isSignedIn, isLoaded, router]);

  return null; // This component renders nothing
}