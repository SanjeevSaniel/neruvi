import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <ChatInterface />;
}