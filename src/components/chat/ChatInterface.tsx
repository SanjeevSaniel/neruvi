// components/chat/ChatInterface.tsx
'use client';

import { useConversationStore } from '@/store/conversationStore';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import CourseSelector, { CourseType } from './CourseSelector';
import MessageDetailPanel from './MessageDetailPanel';
import MessagesContainer from './MessagesContainer';
import { Message, SourceTimestamp } from './types';
import WelcomeScreen from './WelcomeScreen';

interface ChatInterfaceProps {
  courseId?: CourseType;
  conversationId?: string;
}

export default function ChatInterface({ courseId, conversationId }: ChatInterfaceProps = {}) {
  console.log('🚀 ChatInterface component loaded:', {
    courseIdProp: courseId,
    conversationIdProp: conversationId,
    timestamp: new Date().toISOString()
  });
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getCurrentConversation,
    createConversation,
    createTempConversation,
    addMessage,
    updateMessage,
    currentConversationId,
    setCurrentConversation,
    loadConversation,
  } = useConversationStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(!courseId); // Only show course selector if no courseId is provided
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(
    null,
  );
  const [keepPanelOpen, setKeepPanelOpen] = useState(false);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const pendingContentRef = useRef<string>('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current conversation or create one if none exists
  const conversation = getCurrentConversation();
  
  // Use courseId from prop, fallback to conversation course, then null
  const selectedCourse = courseId || conversation?.selectedCourse || null;
  
  // Get suggestion from URL params if present
  const suggestion = searchParams.get('suggestion');
  
  const messages = useMemo(() => {
    const msgs = conversation?.messages || [];
    console.log('🔍 Messages updated:', {
      conversationId: conversation?.id,
      messageCount: msgs.length,
      userMessages: msgs.filter(m => m.role === 'user').length,
      assistantMessages: msgs.filter(m => m.role === 'assistant').length,
      messages: msgs.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 50),
        id: m.id,
        timestamp: m.timestamp
      })),
    });
    return msgs;
  }, [conversation]);

  // Check if we need course selection - only when no conversation exists and no courseId prop
  // If a conversation exists, we should show it regardless of course selection state
  const needsCourseSelection = !currentConversationId && !courseId;

  // Check if we should show welcome screen (course selected but no messages yet)
  const shouldShowWelcome =
    currentConversationId &&
    selectedCourse &&
    messages.length === 0 &&
    !showCourseSelector;

  // Debug logging
  console.log('🔍 ChatInterface render state:', {
    courseIdProp: courseId,
    conversationIdProp: conversationId,
    currentConversationId,
    selectedCourse,
    messagesLength: messages.length,
    needsCourseSelection,
    shouldShowWelcome,
    showCourseSelector,
    hasStartedChat,
    suggestion,
    inputValue: input,
    renderDecision: {
      willShowCourseSelector: showCourseSelector || needsCourseSelection,
      willShowWelcome: shouldShowWelcome,
      willShowChat: !(showCourseSelector || needsCourseSelection) && !shouldShowWelcome
    }
  });

  // Handle header click to navigate to home page
  const handleHeaderClick = () => {
    router.push('/');
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
  const prevConversationIdRef = useRef<string | null>(currentConversationId);

  // Reset chat state when conversation changes
  useEffect(() => {
    const conversation = getCurrentConversation();
    if (conversation) {
      console.log(
        '🔄 Conversation changed:',
        conversation.id,
        'Messages:',
        conversation.messages.length,
      );
      setHasStartedChat(conversation.messages.length > 0);

      // When switching to an existing conversation (from history), always hide course selector
      const conversationChanged =
        prevConversationIdRef.current !== currentConversationId;

      if (conversationChanged && prevConversationIdRef.current !== null) {
        console.log(
          '👥 Conversation switched from history - hiding course selector',
        );
        setShowCourseSelector(false); // Always hide course selector when switching from history
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

  // Handle initial load state
  useEffect(() => {
    if (isInitialLoad) {
      // Only show course selector if there's no current conversation AND no courseId prop
      if (!currentConversationId && !courseId) {
        setShowCourseSelector(true);
      } else if (courseId) {
        // If courseId is provided, never show course selector
        setShowCourseSelector(false);
      }
      // Mark initial load as complete after a short delay to allow store to load
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, currentConversationId, courseId]);

  // Handle courseId prop - create conversation if courseId is provided but no conversation exists
  useEffect(() => {
    console.log('🔍 ChatInterface - courseId useEffect triggered:', {
      courseId,
      currentConversationId,
      suggestion,
      hasCurrentConversation: !!currentConversationId,
      shouldCreateConversation: courseId && !currentConversationId
    });

    const createCourseConversation = async () => {
      if (courseId && !currentConversationId) {
        console.log('🆕 Creating conversation for courseId:', courseId);
        try {
          const conversationId = await createConversation(undefined, courseId);
          console.log('✅ Conversation created successfully:', conversationId);
          setShowCourseSelector(false);
          setIsInitialLoad(false);

          // Navigate to the new URL format with conversation ID
          if (conversationId) {
            console.log('🔄 Navigating to new conversation URL:', `/${courseId}/${conversationId}`);
            router.push(`/${courseId}/${conversationId}`);
          }

          // If there's a suggestion in URL, set it as input for user to submit
          if (suggestion) {
            console.log('📝 Setting suggestion as input:', suggestion);
            setInput(suggestion);
          }
        } catch (error) {
          console.error('❌ Failed to create conversation for course:', error);
        }
      } else {
        console.log('ℹ️ Skipping conversation creation:', {
          reason: !courseId ? 'No courseId' : 'Conversation already exists',
          courseId,
          currentConversationId
        });
      }
    };

    createCourseConversation();
  }, [courseId, currentConversationId, createConversation, suggestion, setInput]);

  // Handle conversationId prop - load specific conversation
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      console.log('🔄 Loading conversation from URL:', conversationId);
      setCurrentConversation(conversationId);
      setShowCourseSelector(false);
      setIsInitialLoad(false);
    }
  }, [conversationId, currentConversationId, setCurrentConversation]);

  // Handle suggestion when conversationId is provided (from suggestions page)
  useEffect(() => {
    if (conversationId && suggestion && currentConversationId === conversationId) {
      console.log('📝 Setting suggestion as input for existing conversation:', {
        conversationId,
        suggestion
      });
      setInput(suggestion);
    }
  }, [conversationId, suggestion, currentConversationId, setInput]);

  // Handle conversation loading when conversationId is provided
  useEffect(() => {
    if (courseId && conversationId) {
      console.log('🔍 ChatInterface - Loading conversation:', {
        courseId,
        conversationId,
        currentConversationId
      });

      // Check if conversation exists
      const existingConversation = getCurrentConversation();

      if (conversationId !== currentConversationId) {
        // Try to load existing conversation first
        loadConversation(conversationId).catch(() => {
          // If conversation doesn't exist, create a temporary one
          console.log('🔄 Conversation not found, creating temporary conversation:', conversationId);

          // Extract course from conversationId if it follows our format
          const courseFromId = conversationId.startsWith('nodejs-') ? 'nodejs' :
                              conversationId.startsWith('python-') ? 'python' : courseId as 'nodejs' | 'python';

          createTempConversation(undefined, courseFromId, conversationId);
          setCurrentConversation(conversationId);
        });
      } else if (!existingConversation?.messages.length) {
        // Reload conversation if it exists but has no messages
        loadConversation(conversationId);
      }
    }
  }, [courseId, conversationId, loadConversation, setCurrentConversation, currentConversationId, getCurrentConversation, createTempConversation]);

  // Reset component state when navigating with courseId but no conversation
  useEffect(() => {
    if (courseId && !conversationId && !currentConversationId) {
      console.log('🔄 Resetting state for course page:', courseId);
      setShowCourseSelector(false);
      setIsInitialLoad(false);
      setMessageDetailOpen(false);
      setSelectedMessage(null);
    }
  }, [courseId, conversationId, currentConversationId]);

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
        // const targetScrollTop = container.scrollHeight - container.clientHeight;

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Verify we actually reached the bottom and retry if not
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const currentScrollTop = messagesContainerRef.current.scrollTop;
            const actualTarget =
              messagesContainerRef.current.scrollHeight -
              messagesContainerRef.current.clientHeight;

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
  }, [streamingMessage?.content, streamingMessage]);

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

  // const safeFormatTimestamp = (timestamp: string): string => {
  //   if (!timestamp || timestamp.includes('NaN') || timestamp === 'undefined') {
  //     return '0:00';
  //   }
  //   const parts = timestamp.split(':');
  //   if (parts.length === 2 && !parts.some((part) => isNaN(Number(part)))) {
  //     const minutes = parseInt(parts[0]);
  //     const seconds = parseInt(parts[1]);
  //     if (minutes >= 0 && seconds >= 0) {
  //       return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  //     }
  //   }
  //   return '0:00';
  // };

  const handleCourseSelect = async (course: CourseType) => {
    try {
      // Always create a NEW conversation for the selected course
      console.log('🆕 Creating new conversation for course:', course);
      await createConversation(undefined, course);
      setShowCourseSelector(false); // Hide selector after selection
      setIsInitialLoad(false); // Mark that user has interacted
    } catch (error) {
      console.error('Failed to select course:', error);
    }
  };

  const handleSuggestionClick = async (
    suggestion: string,
    course: CourseType,
  ) => {
    console.log('🚀 Starting conversation:', suggestion, '- Course:', course);
    console.log('🔍 Debug - Suggestion text:', {
      suggestion,
      suggestionType: typeof suggestion,
      suggestionLength: suggestion?.length,
      suggestionTrimmed: suggestion?.trim(),
    });

    try {
      // Validate suggestion text
      if (!suggestion || !suggestion.trim()) {
        console.error('❌ Invalid suggestion text:', suggestion);
        return;
      }

      // Create a NEW conversation for this suggestion and course
      const conversationId = await createConversation(undefined, course);
      console.log(
        '🆕 Created new conversation for suggestion:',
        conversationId,
      );

      // Ensure conversation is set before proceeding
      if (!conversationId) {
        console.error('❌ Failed to create conversation');
        return;
      }

      // Navigate to the new URL format with conversation ID
      console.log('🔄 Navigating to suggestion conversation URL:', `/${course}/${conversationId}`);
      router.push(`/${course}/${conversationId}`);

      // Update states immediately
      setShowCourseSelector(false); // Hide selector after selection
      setIsInitialLoad(false); // Mark that user has interacted
      setHasStartedChat(true); // Mark chat as started immediately

      // Start the chat immediately with the suggestion
      await handleSubmit(suggestion.trim());
    } catch (error) {
      console.error('❌ Error in handleSuggestionClick:', error);
    }
  };

  const handleSubmit = async (inputText: string) => {
    console.log('🔍 handleSubmit called with:', {
      inputText,
      inputType: typeof inputText,
      inputLength: inputText?.length,
      trimmed: inputText?.trim(),
      isLoading,
      currentConversationId,
    });

    // Enhanced validation
    if (!inputText || typeof inputText !== 'string') {
      console.error('❌ handleSubmit received invalid input:', { inputText, type: typeof inputText });
      return;
    }
    
    if (!inputText.trim() || isLoading) {
      console.log('🔍 handleSubmit early return:', { trimmed: inputText.trim(), isLoading });
      return;
    }
    
    // Clear input immediately at the start to provide instant feedback
    setInput('');
    
    if (!hasStartedChat) setHasStartedChat(true);

    let conversationId = currentConversationId;
    console.log('🔍 Current conversation state:', {
      currentConversationId,
      hasConversation: !!conversation,
      conversationIdInDb: conversation?.id,
    });

    if (!conversationId) {
      const course = selectedCourse || 'nodejs'; // Default to nodejs
      conversationId = await createConversation(undefined, course);
      console.log('🔍 Created new conversation:', conversationId);
    }

    // Ensure conversationId is valid
    if (!conversationId) {
      console.error('❌ No valid conversationId available');
      return;
    }

    const trimmedContent = inputText.trim();
    if (!trimmedContent) {
      console.error('❌ Content is empty after trimming:', { original: inputText, trimmed: trimmedContent });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
      sources: [],
    };

    console.log('🔍 Debug - Adding message:', {
      conversationId,
      messageRole: userMessage.role,
      messageContent: userMessage.content,
      messageContentType: typeof userMessage.content,
      hasConversationId: !!conversationId,
      fullMessage: userMessage,
    });

    try {
      await addMessage(conversationId, userMessage);
      console.log('✅ Message added successfully');
    } catch (messageError) {
      console.error('❌ Failed to add message:', messageError);
      return;
    }

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

      console.log('🔍 DEBUG: All response headers:', {
        headers: Object.fromEntries(response.headers.entries()),
        sourcesHeader: sourcesHeader
      });

      if (sourcesHeader) {
        try {
          const parsedSources = JSON.parse(sourcesHeader);
          sources = parsedSources; // Use exact timestamps from API
          console.log(
            `🔍 Frontend received ${sources.length} sources:`,
            sources,
          );
          console.log('🔍 Detailed source analysis:', sources.map(s => ({
            course: s.course,
            section: s.section,
            timestamp: s.timestamp,
            relevance: s.relevance,
            videoId: s.videoId
          })));
        } catch (error) {
          console.error('Error parsing sources:', error);
          // Continue without sources - deployment compatibility
        }
      } else {
        console.log('❌ No X-Sources header received from API');
        console.log('🔍 All available headers:', Array.from(response.headers.keys()));
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

      // Note: Assistant message will be saved after streaming completes with final content

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
                  messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
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
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }

          // Delayed scroll to catch any rendering delays
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
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
        console.log('🔄 Updating assistant message with final content:', {
          messageId: assistantMessage.id,
          finalContentLength: accumulatedContent.length,
          conversationId
        });
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
      await addMessage(conversationId, errorMsg);

      // If we were streaming and got an error, show the error in the panel
      if (streamingMessage) {
        setSelectedMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
      // Clear streaming state when done but keep panel open with final message
      setTimeout(async () => {
        // Create final message from the accumulated content if assistantMessage exists
        if (assistantMessage && accumulatedContent) {
          const finalMessage: Message = {
            ...assistantMessage,
            content: accumulatedContent,
          };

          // CRITICAL: Persist the final assistant message to database
          console.log('🤖 About to save final assistant message:', {
            conversationId,
            messageId: assistantMessage.id,
            role: assistantMessage.role,
            contentLength: accumulatedContent.length,
            sources: assistantMessage.sources?.length || 0,
            timestamp: assistantMessage.timestamp
          });

          try {
            // Only add message if it doesn't already exist in the messages array
            const existingMessage = messages.find(msg => msg.id === assistantMessage.id);
            if (!existingMessage) {
              await addMessage(conversationId, finalMessage);
              console.log('✅ Final assistant message saved successfully:', assistantMessage.id);
            } else {
              console.log('ℹ️ Assistant message already exists, skipping duplicate save');
            }
          } catch (assistantSaveError) {
            console.error('❌ Failed to save final assistant message:', assistantSaveError);
            console.error('💥 Final assistant message data:', finalMessage);
          }

          // Clear streaming state but keep panel open
          setStreamingMessage(null);
          setSelectedMessage(finalMessage);
          setMessageDetailOpen(true); // Explicitly ensure panel stays open

          // Final scroll after streaming state is cleared
          scrollToBottom('smooth');
        } else {
          // Just clear streaming state if no valid message
          setStreamingMessage(null);
        }
      }, 500);
    }
  };

  return (
    <div
      className='h-screen flex flex-col overflow-hidden relative'
      style={{
        background:
          'linear-gradient(to bottom right, #bde0ca, #dcefe2, #459071)',
      }}>
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
        <div className='flex-1 flex justify-center min-w-0'>
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
        </div>

        {/* Message Detail Panel - Side by side - Only show in chat interface */}
        <AnimatePresence>
          {messageDetailOpen &&
            !needsCourseSelection &&
            !showCourseSelector && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
                className='w-1/2 bg-white border-l border-slate-200'>
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
