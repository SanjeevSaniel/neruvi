'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link'; // Add this import
import ModernAdminDashboard from '@/components/admin/ModernAdminDashboard';
import { Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { userRole, canAccessAdmin, isLoading } = useUserRole();


  // Redirect if not signed in
  if (isLoaded && !user) {
    redirect('/sign-in');
  }

  // Show loading while Clerk or role data is loading
  if (!isLoaded || isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='flex items-center justify-center space-x-2 mb-4'>
            <Loader2 className='w-6 h-6 animate-spin text-indigo-600' />
            <span className='text-lg text-gray-600'>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have admin/moderator permissions
  if (!canAccessAdmin) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Admin Access Required
          </h1>
          <p className='text-gray-600 mb-6'>
            You need admin permissions to access this dashboard.
          </p>
          <div className='space-y-3'>
            {/* <Link
              href='/admin/setup'
              className='inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors'>
              Grant Admin Access
            </Link>
            <br /> */}
            <Link
              href='/'
              className='inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ModernAdminDashboard />;
}
