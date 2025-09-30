import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

const VALID_COURSE_IDS = ['nodejs', 'python'] as const;
type ValidCourseId = typeof VALID_COURSE_IDS[number];

function isValidCourseId(courseId: string): courseId is ValidCourseId {
  return VALID_COURSE_IDS.includes(courseId as ValidCourseId);
}

interface ConversationPageProps {
  params: Promise<{ courseId: string; conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = await auth();
  const { courseId, conversationId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  if (!isValidCourseId(courseId)) {
    notFound();
  }

  // Validate conversationId format (UUID or custom format)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customPattern = /^conv_\d+_[a-z0-9]+$/i;
  
  if (!uuidPattern.test(conversationId) && !customPattern.test(conversationId)) {
    console.warn('Invalid conversationId format:', conversationId);
    notFound();
  }

  return <ChatInterface courseId={courseId} conversationId={conversationId} />;
}

export async function generateMetadata({ params }: ConversationPageProps) {
  const { courseId, conversationId } = await params;
  
  if (!isValidCourseId(courseId)) {
    return {
      title: 'Course Not Found',
    };
  }

  const courseName = courseId === 'nodejs' ? 'Node.js' : 'Python';
  
  return {
    title: `${courseName} Conversation - Neruvi`,
    description: `Continue your ${courseName} learning conversation`,
  };
}