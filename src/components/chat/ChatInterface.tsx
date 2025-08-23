// components/chat/ChatInterface.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import CourseSelector, { CourseType } from './CourseSelector';
import MessagesContainer from './MessagesContainer';
import MessageDetailPanel from './MessageDetailPanel';
import { Message, SourceTimestamp } from './types';
import WelcomeScreen from './WelcomeScreen';

export default function ChatInterface() {
  const {
    getCurrentConversation,
    createConversation,
    addMessage,
    updateMessage,
    setCourseForConversation,
    currentConversationId,
    getOrCreateConversationForCourse
  } = useConversationStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get current conversation or create one if none exists
  const conversation = getCurrentConversation();
  const messages = conversation?.messages || [];
  const selectedCourse = conversation?.selectedCourse || null;
  
  // Check if we need course selection (no current conversation or no course selected)
  const needsCourseSelection = (!currentConversationId || !selectedCourse) && !showCourseSelector;
  
  // Check if we should show welcome screen (course selected but no messages yet)
  const shouldShowWelcome = currentConversationId && selectedCourse && messages.length === 0 && !showCourseSelector;
  
  // Handle header click to show course selector
  const handleHeaderClick = () => {
    setShowCourseSelector(!showCourseSelector);
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setMessageDetailOpen(true);
  };

  const handleCloseMessageDetail = () => {
    setMessageDetailOpen(false);
    setSelectedMessage(null);
  };
  
  // Don't auto-create conversations - wait for course selection
  // useEffect(() => {
  //   if (!currentConversationId) {
  //     createConversation();
  //   }
  // }, [currentConversationId, createConversation]);

  // Reset chat state when conversation changes
  useEffect(() => {
    const conversation = getCurrentConversation();
    if (conversation) {
      setHasStartedChat(conversation.messages.length > 0);
      setShowCourseSelector(false); // Hide course selector when switching conversations
      // Close message detail panel when switching conversations
      setMessageDetailOpen(false);
      setSelectedMessage(null);
    }
  }, [currentConversationId, getCurrentConversation]);

  // Close panel when navigating away from chat (when course selector is shown)
  useEffect(() => {
    if (needsCourseSelection || showCourseSelector) {
      setMessageDetailOpen(false);
      setSelectedMessage(null);
    }
  }, [needsCourseSelection, showCourseSelector]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      gsap.to(messagesContainerRef.current, {
        scrollTop: messagesContainerRef.current.scrollHeight,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  const safeFormatTimestamp = (timestamp: string): string => {
    if (!timestamp || timestamp.includes('NaN') || timestamp === 'undefined') {
      return '0:00';
    }
    const parts = timestamp.split(':');
    if (parts.length === 2 && !parts.some((part) => isNaN(Number(part)))) {
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      if (minutes >= 0 && seconds >= 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    return '0:00';
  };

  const handleCourseSelect = (course: CourseType) => {
    // Get or create a conversation specific to this course
    getOrCreateConversationForCourse(course);
    setShowCourseSelector(false); // Hide selector after selection
  };

  const handleSuggestionClick = async (suggestion: string, course: CourseType) => {
    // Ensure we have the right conversation for this course
    getOrCreateConversationForCourse(course);
    setShowCourseSelector(false); // Hide selector after selection
    setHasStartedChat(true); // Mark chat as started immediately
    
    // Start the chat with the suggestion
    await handleSubmit(suggestion);
  };

  const handleSubmit = async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;
    if (!hasStartedChat) setHasStartedChat(true);
    
    const conversationId = currentConversationId || createConversation();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
      sources: [],
    };

    addMessage(conversationId, userMessage);
    setInput(''); // Clear input box immediately after sending
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          course: selectedCourse || 'both',
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('No response body');

      // Extract sources from headers
      const sourcesHeader = response.headers.get('X-Sources');
      let sources: SourceTimestamp[] = [];

      if (sourcesHeader) {
        try {
          const parsedSources = JSON.parse(sourcesHeader);
          sources = parsedSources.map((source: SourceTimestamp) => ({
            ...source,
            timestamp: safeFormatTimestamp(source.timestamp),
          }));
        } catch (error) {
          console.error('Error parsing sources:', error);
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sources,
      };

      addMessage(conversationId, assistantMessage);

      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          updateMessage(conversationId, assistantMessage.id, accumulatedContent);
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        sources: [],
      };
      addMessage(conversationId, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-200 via-lavender-100 to-purple-300 relative'>
      {/* Subtle animated overlay for extra depth */}
      <div className='absolute inset-0 bg-gradient-to-tr from-purple-100/50 via-transparent to-purple-200/30 animate-pulse'></div>

      {/* Conversation Sidebar */}
      <ConversationSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Updated ChatHeader with complementary colors */}
      <div className='relative z-10'>
        <ChatHeader 
          onOpenSidebar={() => setSidebarOpen(true)}
          onHeaderClick={handleHeaderClick}
        />
      </div>

      <div className='flex-1 flex min-h-0 relative z-10'>
        {/* Main Content Area */}
        <div className={`${messageDetailOpen ? 'w-1/2' : 'flex-1'} flex justify-center transition-all duration-300`}>
          {(needsCourseSelection || showCourseSelector) ? (
            // Full screen course selection
            <div className='w-full h-full flex flex-col'>
              <CourseSelector
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
                onSuggestionClick={handleSuggestionClick}
                isVisible={needsCourseSelection || showCourseSelector}
              />
            </div>
          ) : shouldShowWelcome ? (
            // Welcome screen after course selection
            <div className='w-full max-w-4xl flex flex-col min-h-0 px-4'>
              <WelcomeScreen onSubmit={handleSubmit} selectedCourse={selectedCourse} />
            </div>
          ) : (
            // Chat interface
            <div className='w-full max-w-4xl flex flex-col min-h-0 px-4'>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex-1 flex flex-col min-h-0'>
                <MessagesContainer
                  ref={messagesContainerRef}
                  messages={messages}
                  isLoading={isLoading}
                  onMessageClick={handleMessageClick}
                  isDetailPanelOpen={messageDetailOpen}
                  selectedMessageId={selectedMessage?.id || null}
                />

                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  disabled={!selectedCourse}
                  placeholder={
                    selectedCourse 
                      ? `Ask me anything about ${selectedCourse === 'both' ? 'programming' : selectedCourse === 'nodejs' ? 'Node.js' : 'Python'}...`
                      : 'Please select a course first...'
                  }
                />
              </motion.div>
            </div>
          )}
        </div>

        {/* Message Detail Panel - Side by side - Only show in chat interface */}
        {messageDetailOpen && !needsCourseSelection && !showCourseSelector && !shouldShowWelcome && (
          <div className="w-1/2">
            <AnimatePresence>
              <MessageDetailPanel
                message={selectedMessage}
                isOpen={messageDetailOpen}
                onClose={handleCloseMessageDetail}
              />
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
