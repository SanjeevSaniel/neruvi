import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { getCourseById, isCourseValid } from '@/lib/courses';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { userId } = await auth();
  const { courseId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Validate course exists and is enabled
  if (!isCourseValid(courseId)) {
    notFound();
  }

  // Generate a new chat ID and redirect to chat page
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const newChatId = `${courseId}-${timestamp}-${randomPart}`;

  redirect(`/courses/${courseId}/${newChatId}`);
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found - Neruvi',
      description: 'The requested course could not be found',
    };
  }

  return {
    title: `${course.displayName} Chat - Neruvi`,
    description: `Start learning ${course.displayName} with Neruvi AI assistant. ${course.description}`,
  };
}

export async function generateStaticParams() {
  // Generate paths for all courses at build time
  const { getEnabledCourseIds } = await import('@/lib/courses');
  const courseIds = getEnabledCourseIds();

  return courseIds.map((courseId) => ({
    courseId,
  }));
}
