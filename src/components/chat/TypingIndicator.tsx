'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TypingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    'Analyzing your question...',
    'Searching course materials...',
    'Crafting a helpful response...',
    'Almost ready...'
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // Increased from 2000ms to 4000ms (4 seconds)
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='flex justify-start'>
      <div className='max-w-[85%]'>
        <div className='flex items-center space-x-2 mb-2'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='w-8 h-8 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white'
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bot className='w-4 h-4 text-white' />
            </motion.div>
          </motion.div>
          <span className='text-sm font-semibold text-purple-700 font-comfortaa'>
            FlowMind
          </span>
        </div>
        <div className='px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-sm'>
          <div className='flex items-center space-x-3'>
            <div className='flex space-x-1 items-center'>
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1], 
                  opacity: [0.5, 1, 0.5],
                  y: [0, -2, 0]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: 0,
                  ease: "easeInOut"
                }}
                className='w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full'
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1], 
                  opacity: [0.5, 1, 0.5],
                  y: [0, -2, 0]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: 0.2,
                  ease: "easeInOut"
                }}
                className='w-2 h-2 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full'
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1], 
                  opacity: [0.5, 1, 0.5],
                  y: [0, -2, 0]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: 0.4,
                  ease: "easeInOut"
                }}
                className='w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full'
              />
            </div>
            <motion.span
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className='text-sm text-slate-600 font-medium'>
              {messages[messageIndex]}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
