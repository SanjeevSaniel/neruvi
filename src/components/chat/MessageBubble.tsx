// components/chat/MessageBubble.tsx
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import MessageRenderer from './MessageRenderer';
import SourcePanel from './SourcePanel';
import { Message } from './types';

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export default function MessageBubble({ message, index }: MessageBubbleProps) {
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes <= 0) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className='space-y-2'>
      
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
          
          {/* Message Header */}
          <div className={`flex items-center mb-2 ${
            message.role === 'user' ? 'justify-end space-x-2' : 'justify-start space-x-2'
          }`}>
            {message.role === 'assistant' && (
              <div className='w-7 h-7 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
                <Sparkles className='w-3.5 h-3.5 text-white' />
              </div>
            )}
            <span className={`text-xs font-medium ${
              message.role === 'user' ? 'order-1 text-purple-600' : 'text-purple-600'
            }`}>
              {message.role === 'assistant' ? 'FlowMind' : 'You'}
            </span>
            <span className='text-xs text-purple-500'>
              {message.timestamp ? formatTimestamp(message.timestamp) : 'Just now'}
            </span>
            {message.role === 'user' && (
              <div className='w-7 h-7 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg order-2'>
                <div className='w-4 h-4 bg-white rounded-full flex items-center justify-center'>
                  <div className='w-2 h-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full'></div>
                </div>
              </div>
            )}
          </div>

          {/* Message Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`px-5 py-4 rounded-2xl shadow-md ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-purple-500/90 via-violet-500/90 to-indigo-500/90 text-white shadow-purple-500/20 ml-6'
                : 'bg-white text-slate-900 border border-slate-200 shadow-lg'
            }`}>
            <MessageRenderer content={message.content} role={message.role} />
          </motion.div>

          {/* Source Panel for Assistant Messages */}
          {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
            <SourcePanel sources={message.sources} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
