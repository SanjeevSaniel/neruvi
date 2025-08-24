'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ClerkClientProviderProps {
  children: ReactNode;
}

export default function ClerkClientProvider({ children }: ClerkClientProviderProps) {
  return <ClerkProvider>{children}</ClerkProvider>;
}