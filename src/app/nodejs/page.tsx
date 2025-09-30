import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function NodejsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Generate a new optimized chat ID and redirect
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const newChatId = `nodejs-${timestamp}-${randomPart}`;

  redirect(`/nodejs/${newChatId}`);
}

export async function generateMetadata() {
  return {
    title: 'Node.js Chat - Neruvi',
    description: 'Start learning Node.js with Neruvi AI assistant',
  };
}