// components/chat/ChatInput.tsx
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;

    await onSubmit(value);
    onChange('');
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className='p-4'>
      <form
        onSubmit={handleSubmit}
        className='max-w-2xl mx-auto'>
        <div className='relative'>
          {/* Enhanced gradient background with hover effects */}
          <div className='absolute -inset-0.5 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-xl opacity-60 blur-sm animate-pulse group-hover:opacity-80 transition-opacity duration-300'></div>

          <motion.div
            className='relative flex items-center bg-white/98 rounded-xl px-3 py-2.5 shadow-lg hover:shadow-2xl focus-within:shadow-2xl transition-all duration-300 group'
            whileHover={{
              scale: 1.01,
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
            }}
            whileFocus={{
              scale: 1.02,
              boxShadow: '0 25px 50px rgba(139, 92, 246, 0.4)',
            }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className={`flex-1 bg-transparent resize-none focus:outline-none text-base transition-all duration-300 ${
                disabled 
                  ? 'text-gray-400 placeholder-gray-400 cursor-not-allowed' 
                  : 'text-purple-900 placeholder-purple-500 hover:placeholder-purple-600'
              }`}
              style={{ 
                minHeight: '20px', 
                maxHeight: '100px',
                overflow: value.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !disabled) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            <motion.button
              type='submit'
              disabled={isLoading || !value.trim() || disabled}
              whileHover={{
                scale: isLoading || !value.trim() || disabled ? 1 : 1.1,
                boxShadow:
                  isLoading || !value.trim() || disabled
                    ? 'none'
                    : '0 10px 20px rgba(139, 92, 246, 0.4)',
              }}
              whileTap={{ scale: isLoading || !value.trim() || disabled ? 1 : 0.9 }}
              className={`ml-2 p-2 rounded-lg transition-all duration-300 ${
                !isLoading && value.trim() && !disabled
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 cursor-pointer'
                  : 'bg-purple-200 text-purple-400 cursor-not-allowed opacity-50'
              }`}>
              <Send className='w-3.5 h-3.5' />
            </motion.button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
