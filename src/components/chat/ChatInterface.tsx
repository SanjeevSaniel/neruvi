// components/chat/ChatInterface.tsx
'use client';

import { useConversationStore } from '@/store/conversationStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import CourseSelector, { CourseType } from './CourseSelector';
import MessageDetailPanel from './MessageDetailPanel';
import MessagesContainer from './MessagesContainer';
import { Message, SourceTimestamp } from './types';
import WelcomeScreen from './WelcomeScreen';

export default function ChatInterface() {
  const {
    getCurrentConversation,
    createConversation,
    addMessage,
    updateMessage,
    currentConversationId,
    getOrCreateConversationForCourse,
  } = useConversationStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [keepPanelOpen, setKeepPanelOpen] = useState(false);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current conversation or create one if none exists
  const conversation = getCurrentConversation();
  const messages = useMemo(() => conversation?.messages || [], [conversation]);
  const selectedCourse = conversation?.selectedCourse || null;

  // Check if we need course selection (no current conversation or no course selected)
  const needsCourseSelection =
    (!currentConversationId || !selectedCourse) && !showCourseSelector;

  // Check if we should show welcome screen (course selected but no messages yet)
  const shouldShowWelcome =
    currentConversationId &&
    selectedCourse &&
    messages.length === 0 &&
    !showCourseSelector;

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
    setKeepPanelOpen(false); // Reset the flag when manually closed
  };
  

  // Don't auto-create conversations - wait for course selection
  // useEffect(() => {
  //   if (!currentConversationId) {
  //     createConversation();
  //   }
  // }, [currentConversationId, createConversation]);

  // Track previous conversation ID to detect actual conversation changes
  const prevConversationIdRef = useRef<string | null>(null);

  // Reset chat state when conversation changes
  useEffect(() => {
    const conversation = getCurrentConversation();
    if (conversation) {
      setHasStartedChat(conversation.messages.length > 0);
      setShowCourseSelector(false); // Hide course selector when switching conversations
      
      // Close message detail panel only when actually switching to a different conversation
      const conversationChanged = prevConversationIdRef.current !== null && 
                                 prevConversationIdRef.current !== currentConversationId;
      
      if (conversationChanged && !streamingMessage && !keepPanelOpen) {
        setMessageDetailOpen(false);
        setSelectedMessage(null);
      }
      
      // Update the previous conversation ID reference
      prevConversationIdRef.current = currentConversationId;
    }
  }, [currentConversationId, getCurrentConversation, streamingMessage, keepPanelOpen]);

  // Close panel when navigating away from chat (when course selector is shown)
  useEffect(() => {
    if (needsCourseSelection || showCourseSelector) {
      setMessageDetailOpen(false);
      setSelectedMessage(null);
    }
  }, [needsCourseSelection, showCourseSelector]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
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

  const handleSuggestionClick = async (
    suggestion: string,
    course: CourseType,
  ) => {
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
    
    let accumulatedContent = ''; // Move to broader scope
    let assistantMessage: Message | null = null; // Declare in broader scope

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

      // Extract sources from headers (optional for deployment compatibility)
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
          // Continue without sources - deployment compatibility
        }
      }
      
      // For deployment: No sources available, but still show AI response

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sources,
      };

      addMessage(conversationId, assistantMessage);
      
      // Auto-show the right panel when streaming starts
      setStreamingMessage(assistantMessage);
      setSelectedMessage(assistantMessage);
      setMessageDetailOpen(true);
      setKeepPanelOpen(true); // Flag to keep panel open after streaming

      let done = false;
      let displayContent = '';
      let contentQueue = '';

      // Smooth streaming with slower, word-by-word display for better readability
      const updateStreamingContent = (newContent: string) => {
        contentQueue = newContent;
        
        // Clear existing timeout
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
        }
        
        // Process content gradually for smoother display
        const processNextChunk = () => {
          if (displayContent.length < contentQueue.length) {
            // Add content word by word or in small chunks for smoother streaming
            const remaining = contentQueue.slice(displayContent.length);
            const nextChunkSize = Math.min(3, remaining.length); // 3 characters at a time
            displayContent += remaining.slice(0, nextChunkSize);
            
            if (assistantMessage) {
              updateMessage(conversationId, assistantMessage.id, displayContent);
              setStreamingMessage({
                ...assistantMessage,
                content: displayContent
              });
            }
            
            // Continue processing if there's more content
            if (displayContent.length < contentQueue.length) {
              streamingTimeoutRef.current = setTimeout(processNextChunk, 80); // 80ms between chunks
            }
          }
        };
        
        processNextChunk();
      };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          updateStreamingContent(accumulatedContent);
        }
      }
      
      // Ensure final content is set after streaming completes
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      
      // Set final content and ensure display catches up
      if (assistantMessage) {
        displayContent = accumulatedContent;
        updateMessage(conversationId, assistantMessage.id, accumulatedContent);
        
        // Create final message object for panel
        const finalMessage = {
          ...assistantMessage,
          content: accumulatedContent
        };
        
        setStreamingMessage(finalMessage);
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
      
      // If we were streaming and got an error, show the error in the panel
      if (streamingMessage) {
        setSelectedMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
      // Clear streaming state when done but keep panel open with final message
      setTimeout(() => {
        // Create final message from the accumulated content if assistantMessage exists
        if (assistantMessage) {
          const finalMessage: Message = {
            ...assistantMessage,
            content: accumulatedContent
          };
          
          // Clear streaming state but keep panel open
          setStreamingMessage(null);
          setSelectedMessage(finalMessage);
          setMessageDetailOpen(true); // Explicitly ensure panel stays open
        }
      }, 500);
    }
  };

  return (
    <div className='h-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-200 via-violet-100 to-purple-300 relative'>
      <div className='absolute inset-0 bg-gradient-to-tr from-purple-100/50 via-transparent to-purple-200/30 animate-pulse'></div>

      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className='relative z-10'>
        <ChatHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onHeaderClick={handleHeaderClick}
        />
      </div>

      <div className='flex-1 flex min-h-0 relative z-10'>
        {/* Main Content Area */}
        <motion.div
          animate={{
            width: messageDetailOpen ? '50%' : '100%',
          }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className='flex justify-center'>
          {needsCourseSelection || showCourseSelector ? (
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
              <WelcomeScreen
                onSubmit={handleSubmit}
                selectedCourse={selectedCourse}
              />
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
                      ? `Ask me anything about ${
                          selectedCourse === 'both'
                            ? 'programming'
                            : selectedCourse === 'nodejs'
                            ? 'Node.js'
                            : 'Python'
                        }...`
                      : 'Please select a course first...'
                  }
                />
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Message Detail Panel - Side by side - Only show in chat interface */}
        <AnimatePresence>
          {messageDetailOpen &&
            !needsCourseSelection &&
            !showCourseSelector &&
            !shouldShowWelcome && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  opacity: { duration: 0.3 },
                }}
                className='overflow-hidden'>
                <MessageDetailPanel
                  message={streamingMessage || selectedMessage}
                  isOpen={messageDetailOpen}
                  onClose={handleCloseMessageDetail}
                  isStreaming={!!streamingMessage}
                />
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
