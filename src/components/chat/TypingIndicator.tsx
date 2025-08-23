'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='flex justify-start'>
      <div className='max-w-[85%]'>
        <div className='flex items-center space-x-2 mb-2'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className='w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <Sparkles className='w-3 h-3 text-white' />
          </motion.div>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
            FlowMind
          </span>
        </div>
        <div className='px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-sm'>
          <div className='flex items-center space-x-3'>
            <div className='flex space-x-1'>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className='w-2 h-2 bg-blue-500 rounded-full'
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className='w-2 h-2 bg-purple-500 rounded-full'
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className='w-2 h-2 bg-blue-500 rounded-full'
              />
            </div>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='text-sm text-gray-800 dark:text-slate-400'>
              Thinking...
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
