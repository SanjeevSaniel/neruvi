/**
 * StudentThreadView - Read-only threading view for students
 * 
 * Features:
 * - Simple, educational thread navigation
 * - Read-only conversation flow view  
 * - Learning-focused UI without complex management controls
 * - Visual conversation timeline
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  MessageSquare,
  Clock,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import { ConversationThread } from '@/lib/threading/types';

interface StudentThreadViewProps {
  threads: ConversationThread[];
  currentThreadId: string;
  onThreadSwitch: (threadId: string) => void;
  className?: string;
  hasActiveConversation?: boolean;
  messageCount?: number;
}

export default function StudentThreadView({
  threads,
  currentThreadId,
  onThreadSwitch,
  className = '',
  hasActiveConversation = false,
  messageCount = 0,
}: StudentThreadViewProps) {
  
  // Debug logging
  console.log('🧵 StudentThreadView Debug:', {
    threadsCount: threads.length,
    threads: threads.map(t => ({ id: t.id, name: t.name, isMainThread: t.isMainThread, messageCount: t.messageCount })),
    currentThreadId,
    hasActiveConversation,
    messageCount
  });
  const formatTimestamp = (date: Date | string) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getThreadDescription = (thread: ConversationThread) => {
    if (thread.isMainThread) {
      return 'Main conversation thread';
    }
    return `Branch from main conversation`;
  };

  const sortedThreads = threads.sort((a, b) => {
    // Main thread first, then by creation date
    if (a.isMainThread) return -1;
    if (b.isMainThread) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (threads.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className='text-center text-gray-500'>
          <Navigation className='w-8 h-8 mx-auto mb-3 opacity-50' />
          <h3 className='text-sm font-medium text-gray-600 mb-1'>
            {hasActiveConversation && messageCount > 0
              ? 'Initializing Threading...'
              : 'No Conversation Started'}
          </h3>
          <p className='text-xs text-gray-500'>
            {hasActiveConversation && messageCount > 0
              ? 'Threading system is setting up your conversation flow.'
              : 'Start chatting to see your conversation flow!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gradient-to-b from-blue-50 to-white ${className}`}>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-2'>
          <Navigation className='w-5 h-5 text-blue-600' />
          <h3 className='font-semibold text-gray-800'>Your Learning Journey</h3>
        </div>
        <p className='text-sm text-gray-600'>
          Navigate through your conversation topics and see how your learning
          has progressed.
        </p>
      </div>

      {/* Thread List */}
      <div className='space-y-3'>
        {sortedThreads.map((thread, index) => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}>
            <ThreadCard
              thread={thread}
              isActive={thread.id === currentThreadId}
              onSelect={() => onThreadSwitch(thread.id)}
              formatTimestamp={formatTimestamp}
              getThreadDescription={getThreadDescription}
            />
          </motion.div>
        ))}
      </div>

      {/* Educational Footer */}
      <div className='mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200'>
        <div className='flex items-start gap-2'>
          <GitBranch className='w-4 h-4 text-blue-600 mt-0.5' />
          <div className='text-xs text-blue-700'>
            <p className='font-medium mb-1'>💡 Did you know?</p>
            <p>
              Each thread represents a different topic or direction in your
              conversation. You can switch between them to explore different
              learning paths!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThreadCardProps {
  thread: ConversationThread;
  isActive: boolean;
  onSelect: () => void;
  formatTimestamp: (date: Date) => string;
  getThreadDescription: (thread: ConversationThread) => string;
}

function ThreadCard({ 
  thread, 
  isActive, 
  onSelect, 
  formatTimestamp, 
  getThreadDescription 
}: ThreadCardProps) {
  const getThreadIcon = () => {
    if (thread.isMainThread) return <MessageSquare className="w-4 h-4" />;
    return <GitBranch className="w-4 h-4" />;
  };

  const getThreadColor = () => {
    if (isActive) return 'bg-blue-100 border-blue-300';
    if (thread.isMainThread) return 'bg-green-50 border-green-200';
    return 'bg-white border-gray-200';
  };

  const getIconColor = () => {
    if (isActive) return 'text-blue-600';
    if (thread.isMainThread) return 'text-green-600';
    return 'text-gray-500';
  };

  return (
    <motion.button
      onClick={onSelect}
      className={`
        w-full p-3 rounded-lg border transition-all duration-200 text-left
        hover:shadow-md hover:scale-[1.02] ${getThreadColor()}
        ${isActive ? 'ring-2 ring-blue-200' : ''}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-200' : 'bg-gray-100'}`}>
            <span className={getIconColor()}>
              {getThreadIcon()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm mb-1 truncate ${
              isActive ? 'text-blue-800' : 'text-gray-800'
            }`}>
              {thread.name}
            </h4>
            
            <p className="text-xs text-gray-600 mb-2">
              {getThreadDescription(thread)}
            </p>
            
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatTimestamp(new Date(thread.createdAt))}
              </span>
              
              {thread.messageCount > 0 && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {thread.messageCount} messages
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center text-blue-600">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </motion.button>
  );
}