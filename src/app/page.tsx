import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import RefreshingLandingPage from '@/components/landing/RefreshingLandingPage';

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect('/chat');
  }

  return <RefreshingLandingPage />;
}
