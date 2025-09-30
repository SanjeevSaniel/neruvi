import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

interface NodejsChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function NodejsChatPage({ params }: NodejsChatPageProps) {
  const { userId } = await auth();
  const { chatId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Validate chatId format (optimized format: nodejs-timestamp-random)
  const validChatIdPattern = /^nodejs-[a-z0-9]+-[a-z0-9]+$/i;
  const legacyUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const legacyCustomPattern = /^conv_\d+_[a-z0-9]+$/i;

  if (!validChatIdPattern.test(chatId) &&
      !legacyUuidPattern.test(chatId) &&
      !legacyCustomPattern.test(chatId)) {
    console.warn('Invalid chatId format:', chatId);
    notFound();
  }

  return <ChatInterface courseId="nodejs" conversationId={chatId} />;
}

export async function generateMetadata({ params }: NodejsChatPageProps) {
  const { chatId } = await params;

  return {
    title: `Node.js Chat ${chatId.split('-')[1] || ''} - Neruvi`,
    description: `Continue your Node.js learning conversation`,
  };
}