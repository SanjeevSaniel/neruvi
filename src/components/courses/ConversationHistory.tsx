'use client';

import { useRouter } from 'next/navigation';
import { useConversationStore } from '@/store/conversationStore';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Clock, Archive } from 'lucide-react';
import { CourseType } from './CourseSelectorPage';

interface ConversationHistoryProps {
  courseId?: CourseType;
}

export default function ConversationHistory({ courseId }: ConversationHistoryProps) {
  const router = useRouter();
  const { conversations, loadConversations } = useConversationStore();
  const [isLoading, setIsLoading] = useState(true);

  // Filter conversations by course if courseId is provided
  const filteredConversations = courseId 
    ? conversations.filter(conv => conv.selectedCourse === courseId)
    : conversations;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadConversations();
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadConversations]);

  const handleConversationClick = (conversationId: string, course: CourseType) => {
    router.push(`/chat/courses/${course}/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No conversations yet.</p>
        <p className="text-sm">Start a new conversation to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {courseId ? `${courseId === 'nodejs' ? 'Node.js' : 'Python'} Conversations` : 'Recent Conversations'}
      </h3>
      
      {filteredConversations
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => handleConversationClick(conversation.id, conversation.selectedCourse || 'nodejs')}
            className="group p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600">
                  {conversation.title}
                </h4>
                
                <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                  <span className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {conversation.messages?.length || 0} messages
                  </span>
                  
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                  </span>

                  {conversation.selectedCourse && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      conversation.selectedCourse === 'nodejs' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {conversation.selectedCourse === 'nodejs' ? 'Node.js' : 'Python'}
                    </span>
                  )}
                </div>

                {/* Preview of last message */}
                {conversation.messages && conversation.messages.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400 truncate">
                    {conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 100) || 'No content'}
                  </p>
                )}
              </div>
              
              <div className="ml-2 flex-shrink-0">
                {conversation.archived && (
                  <Archive className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}