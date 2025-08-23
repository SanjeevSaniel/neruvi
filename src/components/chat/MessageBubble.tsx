// components/chat/MessageBubble.tsx
import { motion } from 'framer-motion';
import { Sparkles, Copy, Download, Check, User, Bot } from 'lucide-react';
import { useState } from 'react';
import EnhancedMessageRenderer from './EnhancedMessageRenderer';
import SourcePanel from './SourcePanel';
import { Message } from './types';

interface MessageBubbleProps {
  message: Message;
  index: number;
  onClick?: (message: Message) => void;
}

export default function MessageBubble({ message, index, onClick }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([message.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `message-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='w-8 h-8 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'
              >
                <Sparkles className='w-4 h-4 text-white' />
              </motion.div>
            )}
            <span className={`text-sm font-semibold ${
              message.role === 'user' ? 'order-1 text-purple-700' : 'text-purple-700'
            }`}>
              {message.role === 'assistant' ? 'FlowMind' : 'You'}
            </span>
            <span className={`text-sm font-medium ${
              message.role === 'user' ? 'text-purple-500' : 'text-slate-500'
            }`}>
              {message.timestamp ? formatTimestamp(message.timestamp) : 'Just now'}
            </span>
            {message.role === 'user' && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white order-2'
              >
                <User className='w-4 h-4 text-white' />
              </motion.div>
            )}
          </div>

          {/* Message Bubble - Clickable Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(139, 92, 246, 0.15)' }}
            onClick={() => onClick?.(message)}
            className={`relative group px-5 py-4 rounded-2xl shadow-md cursor-pointer transition-all duration-200 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-purple-500/90 via-violet-500/90 to-indigo-500/90 text-white shadow-purple-500/20 ml-6 hover:shadow-purple-500/30'
                : 'bg-white text-slate-900 border border-slate-200 shadow-lg hover:border-purple-200 hover:shadow-xl'
            }`}>
            <EnhancedMessageRenderer content={message.content} role={message.role} />
            
            {/* Copy and Download Actions - Only for assistant messages */}
            {message.role === 'assistant' && (
              <div className='absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-2'>
                <motion.button
                  whileHover={{ scale: 1.15, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className={`p-2 rounded-full transition-all duration-200 shadow-lg ${
                    copied
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-xl'
                  }`}
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className='p-2 rounded-full transition-all duration-200 shadow-lg bg-purple-500 hover:bg-purple-600 text-white hover:shadow-xl'
                  title='Download as text file'
                >
                  <Download className='w-4 h-4' />
                </motion.button>
              </div>
            )}
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
