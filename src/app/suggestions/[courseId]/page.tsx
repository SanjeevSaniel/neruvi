import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import SuggestionsPage from '@/components/courses/SuggestionsPage';
import { CourseType } from '@/components/courses/SimpleCourseSelector';

interface SuggestionsPageProps {
  params: Promise<{ courseId: string }>;
}

const isValidCourseId = (courseId: string): courseId is CourseType => {
  return courseId === 'nodejs' || courseId === 'python';
};

export default async function SuggestionsRoute({ params }: SuggestionsPageProps) {
  const { userId } = await auth();
  const { courseId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  if (!isValidCourseId(courseId)) {
    notFound();
  }

  return <SuggestionsPage courseId={courseId} />;
}