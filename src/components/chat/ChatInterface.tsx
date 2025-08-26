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
  const [showCourseSelector, setShowCourseSelector] = useState(true); // Start with true to show course selector by default
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(
    null,
  );
  const [keepPanelOpen, setKeepPanelOpen] = useState(false);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current conversation or create one if none exists
  const conversation = getCurrentConversation();
  const messages = useMemo(() => conversation?.messages || [], [conversation]);
  const selectedCourse = conversation?.selectedCourse || null;

  // Check if we need course selection (no current conversation or conversation has messages but no course)
  const needsCourseSelection = !currentConversationId || (!selectedCourse && messages.length === 0);

  // Check if we should show welcome screen (course selected but no messages yet)
  const shouldShowWelcome =
    currentConversationId &&
    selectedCourse &&
    messages.length === 0 &&
    !showCourseSelector;

  // Debug logging
  console.log('🔍 ChatInterface state:', {
    currentConversationId,
    selectedCourse,
    messagesLength: messages.length,
    needsCourseSelection,
    shouldShowWelcome,
    showCourseSelector,
    hasStartedChat
  });

  // Handle header click to show course selector
  const handleHeaderClick = () => {
    setShowCourseSelector(true);
    setMessageDetailOpen(false); // Close message detail panel
    setSelectedMessage(null);
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
      console.log('🔄 Conversation changed:', conversation.id, 'Messages:', conversation.messages.length);
      setHasStartedChat(conversation.messages.length > 0);
      
      // Only hide course selector when actually switching conversations, not on initial load
      const conversationChanged =
        prevConversationIdRef.current !== null &&
        prevConversationIdRef.current !== currentConversationId;
      
      if (conversationChanged) {
        console.log('👥 Conversation switched - hiding course selector');
        setShowCourseSelector(false); // Hide course selector when switching conversations
        setIsInitialLoad(false); // Mark as no longer initial load
        
        if (!streamingMessage && !keepPanelOpen) {
          setMessageDetailOpen(false);
          setSelectedMessage(null);
        }
      }

      // Update the previous conversation ID reference
      prevConversationIdRef.current = currentConversationId;
    }
  }, [
    currentConversationId,
    getCurrentConversation,
    streamingMessage,
    keepPanelOpen,
  ]);

  // Close panel when navigating away from chat (when course selector is shown)
  useEffect(() => {
    if (needsCourseSelection || showCourseSelector) {
      setMessageDetailOpen(false);
      setSelectedMessage(null);
    }
  }, [needsCourseSelection, showCourseSelector]);

  // Ensure course selector is shown on initial load, regardless of stored state
  useEffect(() => {
    if (isInitialLoad) {
      setShowCourseSelector(true);
      // Mark initial load as complete after a short delay to allow store to load
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  const scrollToBottom = (forceBehavior: 'smooth' | 'instant' = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: forceBehavior,
      });
    }
  };

  // Enhanced scrolling during streaming with verification
  const scrollToBottomDuringStreaming = () => {
    if (messagesContainerRef.current) {
      const attemptScroll = (retries = 3) => {
        if (!messagesContainerRef.current || retries <= 0) return;
        
        const container = messagesContainerRef.current;
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Verify we actually reached the bottom and retry if not
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const currentScrollTop = messagesContainerRef.current.scrollTop;
            const actualTarget = messagesContainerRef.current.scrollHeight - messagesContainerRef.current.clientHeight;
            
            // If we're not within 10px of the bottom, try again
            if (Math.abs(currentScrollTop - actualTarget) > 10) {
              attemptScroll(retries - 1);
            }
          }
        }, 20);
      };
      
      // Use RAF to ensure DOM updates, then attempt scroll with retries
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          attemptScroll();
        });
      });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Additional effect to handle scrolling during streaming content updates
  useEffect(() => {
    if (streamingMessage) {
      scrollToBottomDuringStreaming();
    }
  }, [streamingMessage?.content]);

  // More aggressive scroll effect specifically for streaming content changes
  useEffect(() => {
    if (streamingMessage?.content) {
      // Use multiple timing strategies to ensure scroll reaches bottom
      const scrollAttempts = [0, 50, 100, 200]; // Multiple attempts with different delays
      
      scrollAttempts.forEach((delay) => {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, delay);
      });
    }
  }, [streamingMessage?.content]);

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
    setIsInitialLoad(false); // Mark that user has interacted
  };

  const handleSuggestionClick = async (
    suggestion: string,
    course: CourseType,
  ) => {
    console.log('🚀 Starting conversation:', suggestion, '- Course:', course);
    
    try {
      // Ensure we have the right conversation for this course (this updates selectedCourse)
      const conversationId = getOrCreateConversationForCourse(course);
      
      // Update states immediately
      setShowCourseSelector(false); // Hide selector after selection  
      setIsInitialLoad(false); // Mark that user has interacted
      setHasStartedChat(true); // Mark chat as started immediately

      // Start the chat immediately with the suggestion
      await handleSubmit(suggestion);
    } catch (error) {
      console.error('❌ Error in handleSuggestionClick:', error);
    }
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
          course: selectedCourse || 'nodejs', // Default to nodejs since we removed 'both'
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
          sources = parsedSources; // Use exact timestamps from API
          console.log(`🔍 Frontend received ${sources.length} sources:`, sources);
        } catch (error) {
          console.error('Error parsing sources:', error);
          // Continue without sources - deployment compatibility
        }
      } else {
        console.log('❌ No X-Sources header received from API');
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
              updateMessage(
                conversationId,
                assistantMessage.id,
                displayContent,
              );
              setStreamingMessage({
                ...assistantMessage,
                content: displayContent,
              });

              // Ensure scrolling stays at bottom during content updates
              scrollToBottomDuringStreaming();
              
              // Additional immediate scroll with setTimeout to catch any DOM delays
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 20);
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
          
          // Multiple scroll triggers for new stream chunks to ensure we reach bottom
          scrollToBottomDuringStreaming();
          
          // Immediate scroll
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
          
          // Delayed scroll to catch any rendering delays
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 30);
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
          content: accumulatedContent,
        };

        setStreamingMessage(finalMessage);
        
        // Final scroll to bottom after streaming completes
        setTimeout(() => scrollToBottom('instant'), 100);
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
            content: accumulatedContent,
          };

          // Clear streaming state but keep panel open
          setStreamingMessage(null);
          setSelectedMessage(finalMessage);
          setMessageDetailOpen(true); // Explicitly ensure panel stays open
          
          // Final scroll after streaming state is cleared
          scrollToBottom('smooth');
        }
      }, 500);
    }
  };

  return (
    <div className='h-screen flex flex-col overflow-hidden relative' style={{background: 'linear-gradient(to bottom right, #bde0ca, #dcefe2, #459071)'}}>
      <div className='absolute inset-0 bg-gradient-to-tr from-green-100/50 via-transparent to-green-200/30 animate-pulse'></div>

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
          {showCourseSelector || needsCourseSelection ? (
            // Full screen course selection
            <div className='w-full h-full flex flex-col'>
              <CourseSelector
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
                onSuggestionClick={handleSuggestionClick}
                isVisible={showCourseSelector || needsCourseSelection}
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
                  streamingMessage={streamingMessage}
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
                          selectedCourse === 'nodejs' ? 'Node.js' : 'Python'
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
            !showCourseSelector && (
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
