import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { getCourseById, isCourseValid } from '@/lib/courses';

interface CourseChatPageProps {
  params: Promise<{ courseId: string; chatId: string }>;
}

export default async function CourseChatPage({ params }: CourseChatPageProps) {
  const { userId } = await auth();
  const { courseId, chatId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Validate course exists and is enabled
  if (!isCourseValid(courseId)) {
    notFound();
  }

  // Validate chatId format
  // Optimized format: {courseId}-{timestamp}-{random}
  const validChatIdPattern = new RegExp(`^${courseId}-[a-z0-9]+-[a-z0-9]+$`, 'i');

  // Also support legacy formats for backward compatibility
  const legacyUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const legacyCustomPattern = /^conv_\d+_[a-z0-9]+$/i;
  const legacyPrefixPattern = new RegExp(`^${courseId}-`, 'i'); // Matches old nodejs-*, python-* formats

  if (!validChatIdPattern.test(chatId) &&
      !legacyUuidPattern.test(chatId) &&
      !legacyCustomPattern.test(chatId) &&
      !legacyPrefixPattern.test(chatId)) {
    console.warn('Invalid chatId format:', chatId);
    notFound();
  }

  return <ChatInterface courseId={courseId} conversationId={chatId} />;
}

export async function generateMetadata({ params }: CourseChatPageProps) {
  const { courseId, chatId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found - Neruvi',
      description: 'The requested course could not be found',
    };
  }

  // Extract readable timestamp from chatId if possible
  const chatTimestamp = chatId.split('-')[1] || '';

  return {
    title: `${course.displayName} Chat ${chatTimestamp} - Neruvi`,
    description: `Continue your ${course.displayName} learning conversation with Neruvi AI`,
  };
}
