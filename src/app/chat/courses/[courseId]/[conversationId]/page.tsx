import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { isCourseValid } from '@/lib/courses';

interface ConversationPageProps {
  params: Promise<{ courseId: string; conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = await auth();
  const { courseId, conversationId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  if (!isCourseValid(courseId)) {
    notFound();
  }

  // Validate conversationId format (UUID or custom format)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customPattern = /^conv_\d+_[a-z0-9]+$/i;
  const courseBasedPattern = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/i;

  if (!uuidPattern.test(conversationId) && !customPattern.test(conversationId) && !courseBasedPattern.test(conversationId)) {
    console.warn('Invalid conversationId format:', conversationId);
    notFound();
  }

  return <ChatInterface courseId={courseId} conversationId={conversationId} />;
}

export async function generateMetadata({ params }: ConversationPageProps) {
  const { courseId } = await params;
  const { getCourseById } = await import('@/lib/courses');
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.displayName} Conversation - Neruvi`,
    description: `Continue your ${course.displayName} learning conversation`,
  };
}