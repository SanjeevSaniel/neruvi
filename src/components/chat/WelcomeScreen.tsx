// components/chat/WelcomeScreen.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Code2, FileText, Sparkles, Zap, Send } from 'lucide-react';
import { Suggestion } from './types';
import Image from 'next/image';

interface WelcomeScreenProps {
  onSubmit: (text: string) => Promise<void>;
}

export default function WelcomeScreen({ onSubmit }: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestions: Suggestion[] = [
    { icon: Code2, text: 'Explain async/await in Node.js' },
    { icon: FileText, text: 'Python list comprehensions tutorial' },
    { icon: Zap, text: 'Express.js middleware concepts' },
    { icon: Sparkles, text: 'Best practices for error handling' },
  ];

  const handleSuggestionClick = async (text: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(text);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onSubmit(input);
    setInput('');
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='flex-1 flex flex-col items-center justify-center p-4'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-8 max-w-2xl'>
        <div className='w-12 h-12 bg-gradient-to-br from-white via-violet-100 to-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg'>
          <Image
            src='/flowmind-logo-2.png'
            alt='FlowMind Logo'
            width={50}
            height={50}
          />
        </div>

        <h2 className='text-2xl font-bold text-purple-900 mb-3'>
          Welcome to FlowMind
        </h2>
        <p className='text-base text-purple-800 mb-6 leading-relaxed'>
          Your intelligent programming assistant for Node.js and Python
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-8'>
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              index={index}
              onClick={handleSuggestionClick}
              disabled={isSubmitting}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className='w-full max-w-2xl px-4'>
        <form onSubmit={handleSubmit}>
          <div className='relative group'>
            {/* Enhanced animated background */}
            <motion.div
              className='absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-3xl blur-sm opacity-75'
              animate={{
                opacity: [0.75, 0.9, 0.75],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className='relative flex items-center bg-white/98 rounded-2xl px-4 py-2 shadow-xl backdrop-blur-sm'
              whileHover={{
                scale: 1.01,
                boxShadow:
                  '0 25px 50px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1)',
              }}
              whileFocus={{
                scale: 1.02,
                boxShadow:
                  '0 30px 60px rgba(139, 92, 246, 0.3), 0 0 0 2px rgba(139, 92, 246, 0.2)',
              }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask me about Node.js or Python programming...'
                rows={1}
                className='flex-1 bg-transparent text-purple-900 placeholder-purple-500/70 resize-none focus:outline-none text-base leading-relaxed transition-all duration-300 focus:placeholder-purple-600/80'
                style={{ minHeight: '24px', maxHeight: '120px' }}
                onFocus={(e) => {
                  e.target.style.transform = 'scale(1.01)';
                }}
                onBlur={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              <motion.button
                type='submit'
                disabled={isSubmitting || !input.trim()}
                whileHover={{
                  scale: isSubmitting || !input.trim() ? 1 : 1.05,
                  boxShadow:
                    isSubmitting || !input.trim()
                      ? 'none'
                      : '0 10px 25px rgba(139, 92, 246, 0.4)',
                }}
                whileTap={{ scale: isSubmitting || !input.trim() ? 1 : 0.95 }}
                className={`ml-4 p-2 rounded-xl transition-all duration-300 ${
                  !isSubmitting && input.trim()
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 cursor-pointer transform hover:scale-105'
                    : 'bg-purple-200 text-purple-400 cursor-not-allowed opacity-50'
                }`}>
                <Send className='w-5 h-5' />
              </motion.button>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const SuggestionCard = ({
  suggestion,
  index,
  onClick,
  disabled,
}: {
  suggestion: Suggestion;
  index: number;
  onClick: (text: string) => void;
  disabled: boolean;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 + 0.2 }}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    onClick={() => !disabled && onClick(suggestion.text)}
    disabled={disabled}
    className='p-3 bg-white/95 backdrop-blur-sm border border-purple-200 rounded-lg text-left hover:border-purple-400 hover:shadow-md transition-all duration-300 disabled:opacity-50'>
    <div className='flex items-center space-x-3'>
      <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
        <suggestion.icon className='w-4 h-4 text-purple-600' />
      </div>
      <p className='text-sm font-medium text-purple-900'>{suggestion.text}</p>
    </div>
  </motion.button>
);
