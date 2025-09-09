import { redirect } from 'next/navigation';

export default async function CoursesPage() {
  // Redirect /courses to the main page (which now shows the course selector)
  redirect('/');
}