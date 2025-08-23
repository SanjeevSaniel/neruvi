// components/chat/ChatHeader.tsx
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import FlowMindLogo from '../FlowMindLogo';

const AIStatusIndicator = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className='flex items-center space-x-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg'>
      {/* AI Brain Icon with Animation */}
      <div className='relative'>
        <Brain className='w-5 h-5 text-white drop-shadow-sm' />

        {/* Status dot */}
        <div className='absolute -top-1 -right-1'>
          <motion.div
            className='w-3 h-3 rounded-full bg-emerald-400 shadow-sm'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Ping effect */}
          <motion.div className='absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-30' />
        </div>
      </div>

      {/* Status Text */}
      <div className='flex flex-col'>
        <span className='text-white text-sm font-bold tracking-wide'>
          AI ACTIVE
        </span>
        <span className='text-purple-100 text-xs opacity-90'>GPT-4o Ready</span>
      </div>
    </motion.div>
  );
};

export default function ChatHeader() {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='relative h-16 flex items-center justify-center flex-shrink-0 overflow-hidden'>
      {/* Clean gradient background */}
      <div className='absolute inset-0 bg-gradient-to-r from-purple-600/95 via-violet-600/98 to-purple-700/95 backdrop-blur-xl'>
        {/* Subtle animated overlay */}
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent'
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Bottom border */}
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent' />

      <div className='relative w-full max-w-6xl mx-auto px-6 flex items-center justify-between'>
        {/* Logo Section */}
        <motion.div
          className='flex justify-center items-center gap-2'
          // whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <div className='mt-4'>
            <FlowMindLogo />
          </div>

          {/* Brand Text */}
          <div>
            <h1 className='text-xl font-bold text-white drop-shadow-lg tracking-tight'>
              FlowMind
            </h1>
            <p className='text-xs text-purple-100/90 font-semibold -mt-0.5 drop-shadow-sm'>
              AI Programming Assistant
            </p>
          </div>
        </motion.div>

        {/* Single AI Status Indicator */}
        <div className='hidden md:block'>
          <AIStatusIndicator />
        </div>

        {/* Mobile compact version */}
        <div className='md:hidden'>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className='flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20'>
            <div className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
            <span className='text-white text-xs font-semibold'>AI Ready</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
