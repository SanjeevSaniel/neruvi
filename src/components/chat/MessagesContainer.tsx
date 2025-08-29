// components/chat/MessagesContainer.tsx
import { forwardRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import { Message } from './types';
import MessageBubble from './MessageBubble';

interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
  onMessageClick?: (message: Message) => void;
  isDetailPanelOpen?: boolean;
  selectedMessageId?: string | null;
  streamingMessage?: Message | null;
}

const MessagesContainer = forwardRef<HTMLDivElement, MessagesContainerProps>(
  ({ messages, isLoading, onMessageClick, isDetailPanelOpen, selectedMessageId, streamingMessage }, ref) => {
    // Debug what messages are being rendered
    console.log('💬 MessagesContainer rendering:', {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      messageDetails: messages.map(m => ({ 
        id: m.id, 
        role: m.role, 
        content: m.content?.substring(0, 30),
        timestamp: m.timestamp 
      }))
    });
    
    return (
      <div
        ref={ref}
        className='flex-1 overflow-y-auto pr-0 pl-6 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-300 hover:scrollbar-thumb-purple-400'>
        <div className='max-w-2xl mx-auto space-y-4 pr-6'>
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
                onClick={onMessageClick}
                isCompactMode={true}
                isSelected={selectedMessageId === message.id}
              />
            ))}
          </AnimatePresence>
          {isLoading && !streamingMessage && <TypingIndicator />}
        </div>
      </div>
    );
  },
);

MessagesContainer.displayName = 'MessagesContainer';
export default MessagesContainer;
