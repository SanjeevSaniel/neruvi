import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { isCourseValid, getEnabledCourseIds, getCourseById } from '@/lib/courses';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { userId } = await auth();
  const { courseId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  if (!isCourseValid(courseId)) {
    notFound();
  }

  return <ChatInterface courseId={courseId} />;
}

export async function generateStaticParams() {
  const courseIds = getEnabledCourseIds();
  return courseIds.map((courseId) => ({
    courseId,
  }));
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.displayName} Learning Chat - Neruvi`,
    description: `Interactive ${course.displayName} learning chat powered by AI`,
  };
}