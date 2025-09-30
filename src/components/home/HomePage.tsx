'use client';

// import { useUser } from '@clerk/nextjs';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatHeader from '@/components/chat/ChatHeader';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import CourseSelectorPage from '@/components/courses/CourseSelectorPage';
// import { UserRole } from '@/lib/threading/permissions';

export default function HomePage() {
  // const { user } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get user role for threading permissions
  // const userRole: UserRole =
  //   user?.publicMetadata?.role === 'admin'
  //     ? 'admin'
  //     : user?.publicMetadata?.role === 'moderator'
  //     ? 'moderator'
  //     : 'user';

  // Handle header/logo click - navigate to home page
  const handleHeaderClick = () => {
    router.push('/');
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <ConversationSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Header - using same pattern as ChatInterface */}
        <div className='relative z-10'>
          <ChatHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            onHeaderClick={handleHeaderClick}
            // canToggleThreadView={false} // No threading on home page
            // userRole={userRole}
            // showThreadSidebar={false}
            // onToggleThreadSidebar={() => {}} // No-op
            // threadsCount={0}
            // hasActiveConversation={false} // No active conversation on home page
          />
        </div>

        {/* Course Selector Content - Allow scrolling */}
        <div className='flex-1 overflow-y-auto'>
          <CourseSelectorPage />
        </div>
      </div>
    </div>
  );
}