import { redirect } from 'next/navigation';

export default async function ChatPage() {
  // Redirect /chat to the main page (which now shows the course selector)
  redirect('/');
}