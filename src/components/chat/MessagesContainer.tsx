// components/chat/MessagesContainer.tsx
import { forwardRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import { Message } from './types';
import MessageBubble from './MessageBubble';

interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
}

const MessagesContainer = forwardRef<HTMLDivElement, MessagesContainerProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <div
        ref={ref}
        className='flex-1 overflow-y-auto px-6 py-4'>
        <div className='max-w-2xl mx-auto space-y-4'>
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
              />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
        </div>
      </div>
    );
  },
);

MessagesContainer.displayName = 'MessagesContainer';
export default MessagesContainer;
