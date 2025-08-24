import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

export default async function ChatPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <ChatInterface />;
}