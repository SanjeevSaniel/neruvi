import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';

const VALID_COURSE_IDS = ['nodejs', 'python'] as const;
type ValidCourseId = typeof VALID_COURSE_IDS[number];

function isValidCourseId(courseId: string): courseId is ValidCourseId {
  return VALID_COURSE_IDS.includes(courseId as ValidCourseId);
}

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { userId } = await auth();
  const { courseId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  if (!isValidCourseId(courseId)) {
    notFound();
  }

  return <ChatInterface courseId={courseId} />;
}

export async function generateStaticParams() {
  return VALID_COURSE_IDS.map((courseId) => ({
    courseId,
  }));
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { courseId } = await params;
  
  if (!isValidCourseId(courseId)) {
    return {
      title: 'Course Not Found',
    };
  }

  const courseName = courseId === 'nodejs' ? 'Node.js' : 'Python';
  
  return {
    title: `${courseName} Learning Chat - FlowMind`,
    description: `Interactive ${courseName} learning chat powered by AI`,
  };
}