// components/chat/ChatHeader.tsx
import { motion } from 'framer-motion';
import { Brain, Shield } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import NeruviBrandLogo from '../NeruviBrandLogo';
import ConversationHistoryIcon from '../ui/ConversationHistoryIcon';
import { useUserRole as useUserRoleHook } from '@/hooks/useUserRole';

const AIStatusIndicator = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className='flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md shadow-lg'>
      {/* AI Brain Icon with Animation */}
      <div className='relative'>
        <Brain
          className='w-4 h-4 drop-shadow-sm'
          style={{ color: 'white' }}
        />

        {/* Status dot */}
        <div className='absolute -top-0.5 -right-0.5'>
          <motion.div
            className='w-2 h-2 rounded-full bg-emerald-400 shadow-sm'
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
          <motion.div className='absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30' />
        </div>
      </div>

      {/* Status Text */}
      <div className='flex flex-col'>
        <span
          className='text-xs font-semibold tracking-wide'
          style={{ color: 'white' }}>
          AI
        </span>
        {/* <span className='text-primary-100 text-[10px] opacity-90'>
          GPT-4o
        </span> */}
      </div>
    </motion.div>
  );
};

interface ChatHeaderProps {
  onOpenSidebar?: () => void;
  onHeaderClick?: () => void;
}

export default function ChatHeader({
  onOpenSidebar,
  onHeaderClick,
}: ChatHeaderProps) {
  const { userRole: currentUserRole, canAccessAdmin, isLoading } = useUserRoleHook();


  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className='relative h-12 flex items-center justify-center flex-shrink-0 overflow-hidden'>
      {/* Clean gradient background */}
      <div
        className='absolute inset-0 backdrop-blur-xl'
        style={{
          background:
            'linear-gradient(to right, rgba(78, 166, 116, 0.95), rgba(69, 144, 113, 0.98), rgba(69, 144, 113, 0.95))',
        }}>
        {/* Subtle animated overlay */}
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent'
          animate={{ x: ['0%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Bottom border */}
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent' />

      <div className='relative w-full max-w-6xl mx-auto px-4 flex items-center justify-between'>
        {/* Left Side - Menu and Logo */}
        <div className='flex items-center space-x-3'>
          {/* Conversation History Button */}
          {onOpenSidebar && (
            <motion.button
              onClick={onOpenSidebar}
              className='p-1.5 hover:bg-white/10 rounded-lg transition-all duration-300'
              style={{ color: 'white' }}
              title='View conversation history'
              whileHover={{
                scale: 1.05,
                boxShadow: '0 4px 8px rgba(255, 255, 255, 0.1)',
              }}
              whileTap={{ scale: 0.95 }}>
              <ConversationHistoryIcon
                className='w-4 h-4'
                size={16}
              />
            </motion.button>
          )}

          {/* Logo Section - Clickable */}
          <button
            onClick={onHeaderClick}
            className='flex justify-center items-center gap-2 p-1.5 rounded-lg cursor-pointer'
            title='Show course selection'>
            <NeruviBrandLogo size="sm" showIcon={true} showTagline={false} variant="light" />
          </button>
        </div>

        <div className='flex items-center space-x-3'>
          {/* Compact AI Status Indicator */}
          {/* <div className='hidden md:block'>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className='flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20'>
              <div className='relative'>
                <Brain className='w-3 h-3' style={{color: 'white'}} />
                <motion.div
                  className='absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400'
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <span className='text-xs font-medium' style={{color: 'white'}}>AI Ready</span>
            </motion.div>
          </div> */}
          <AIStatusIndicator />

          {/* Mobile version */}
          <div className='md:hidden'>
            <motion.div className='flex items-center space-x-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20'>
              <div className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
              <span
                className='text-xs font-medium'
                style={{ color: 'white' }}>
                AI
              </span>
            </motion.div>
          </div>

          {/* Admin Button - Only visible to admins and moderators */}
          {canAccessAdmin && !isLoading && (
            <Link href='/admin'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-200 cursor-pointer'
                title={`Admin Dashboard (${currentUserRole})`}>
                <Shield className='w-4 h-4 text-white' />
                <span className='text-xs font-medium text-white hidden sm:block'>
                  {currentUserRole === 'admin' ? 'Admin' : 'Mod'}
                </span>
              </motion.button>
            </Link>
          )}

          {/* User Profile - Compact */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8 border-2 border-white/30 shadow-lg',
                userButtonPopoverCard:
                  'bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl',
                userButtonPopoverActionButton: 'hover:bg-primary-50',
              },
            }}
            afterSignOutUrl='/'
          />
        </div>
      </div>
    </motion.div>
  );
}
