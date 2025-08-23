// components/chat/ChatInterface.tsx
'use client';

import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessagesContainer from './MessagesContainer';
import { Message, SourceTimestamp } from './types';
import WelcomeScreen from './WelcomeScreen';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Welcome to FlowMind! I'm your AI learning companion for Node.js and Python programming.",
      timestamp: new Date(),
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      const seconds = parseInt(parts[14]); // Fixed: was parts
      if (minutes >= 0 && seconds >= 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    return '0:00';
  };

  const handleSubmit = async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;
    if (!hasStartedChat) setHasStartedChat(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage]);
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

      setMessages((prev) => [...prev, assistantMessage]);

      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: accumulatedContent }
                : m,
            ),
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
          sources: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-200 via-lavender-100 to-purple-300 relative'>
      {/* Subtle animated overlay for extra depth */}
      <div className='absolute inset-0 bg-gradient-to-tr from-purple-100/50 via-transparent to-purple-200/30 animate-pulse'></div>

      {/* Updated ChatHeader with complementary colors */}
      <div className='relative z-10'>
        <ChatHeader />
      </div>

      <div className='flex-1 flex justify-center min-h-0 relative z-10'>
        <div className='w-full max-w-4xl flex flex-col min-h-0'>
          {!hasStartedChat ? (
            <WelcomeScreen onSubmit={handleSubmit} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='flex-1 flex flex-col min-h-0'>
              <MessagesContainer
                ref={messagesContainerRef}
                messages={messages}
                isLoading={isLoading}
              />

              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
