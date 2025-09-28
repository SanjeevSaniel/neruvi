import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PythonPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Generate a new optimized chat ID and redirect
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const newChatId = `python-${timestamp}-${randomPart}`;

  redirect(`/python/${newChatId}`);
}

export async function generateMetadata() {
  return {
    title: 'Python Chat - FlowMind',
    description: 'Start learning Python with FlowMind AI assistant',
  };
}