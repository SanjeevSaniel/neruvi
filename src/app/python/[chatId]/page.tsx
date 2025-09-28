import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

interface PythonChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function PythonChatPage({ params }: PythonChatPageProps) {
  const { userId } = await auth();
  const { chatId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Validate chatId format (optimized format: python-timestamp-random)
  const validChatIdPattern = /^python-[a-z0-9]+-[a-z0-9]+$/i;
  const legacyUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const legacyCustomPattern = /^conv_\d+_[a-z0-9]+$/i;

  if (!validChatIdPattern.test(chatId) &&
      !legacyUuidPattern.test(chatId) &&
      !legacyCustomPattern.test(chatId)) {
    console.warn('Invalid chatId format:', chatId);
    notFound();
  }

  return <ChatInterface courseId="python" conversationId={chatId} />;
}

export async function generateMetadata({ params }: PythonChatPageProps) {
  const { chatId } = await params;

  return {
    title: `Python Chat ${chatId.split('-')[1] || ''} - FlowMind`,
    description: `Continue your Python learning conversation`,
  };
}