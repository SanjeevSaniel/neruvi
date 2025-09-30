import { auth } from '@clerk/nextjs/server';
import LandingPage from '@/components/landing/LandingPage';
import HomePage from '@/components/home/HomePage';

export default async function Home() {
  const { userId } = await auth();

  // Show home page with course selector for authenticated users, landing page for others
  if (userId) {
    return <HomePage />;
  }

  return <LandingPage />;
}
