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
}

const MessagesContainer = forwardRef<HTMLDivElement, MessagesContainerProps>(
  ({ messages, isLoading, onMessageClick }, ref) => {
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
