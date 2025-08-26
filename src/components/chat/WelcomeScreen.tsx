// components/chat/WelcomeScreen.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Code2, FileText, Sparkles, Zap, Send } from 'lucide-react';
import { Suggestion } from './types';
import FlowMindLogo from '../FlowMindLogo';
import SpeechRecognitionButton from '../ui/SpeechRecognitionButton';
import WaveAnimation from '../ui/WaveAnimation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type CourseType = 'nodejs' | 'python';

interface WelcomeScreenProps {
  onSubmit: (text: string) => Promise<void>;
  selectedCourse?: CourseType | null;
}

export default function WelcomeScreen({ onSubmit, selectedCourse }: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Speech recognition setup
  const {
    finalTranscript,
    interimTranscript,
    isListening,
    hasRecognitionSupport,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    language: 'en-US'
  });

  // Handle final transcript - only add to input when speech recognition stops
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && !isListening) {
      const newText = input + (input ? ' ' : '') + finalTranscript.trim();
      setInput(newText);
      resetTranscript();
    }
  }, [finalTranscript, isListening, input, resetTranscript]);

  // Course-specific suggestions
  const getSuggestions = (course: CourseType | null | undefined): Suggestion[] => {
    const suggestionsByCourse = {
      nodejs: [
        { icon: Code2, text: 'How to create an Express.js server?' },
        { icon: Zap, text: 'Explain async/await in Node.js' },
        { icon: FileText, text: 'What is middleware in Express?' },
        { icon: Sparkles, text: 'JWT authentication setup guide' },
      ],
      python: [
        { icon: Code2, text: 'Python list comprehensions tutorial' },
        { icon: Zap, text: 'Object-oriented programming in Python' },
        { icon: FileText, text: 'How do Python decorators work?' },
        { icon: Sparkles, text: 'Working with pandas for data analysis' },
      ],
    };

    // Default to nodejs suggestions if no course is selected or course is null
    return suggestionsByCourse[course || 'nodejs'] || suggestionsByCourse.nodejs;
  };

  const suggestions = getSuggestions(selectedCourse);

  const handleSuggestionClick = async (text: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(text);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    // Stop any ongoing speech recognition
    if (isListening) {
      stopListening();
    }

    setIsSubmitting(true);
    await onSubmit(input);
    setInput('');
    setIsSubmitting(false);
  };

  const handleMicClick = () => {
    // Don't allow mic interaction when submitting
    if (isSubmitting) {
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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
        <div className='mx-auto mb-4 flex justify-center'>
          <FlowMindLogo size={32} animated={true} className='w-12 h-12' />
        </div>

        <h2 className='text-2xl font-bold mb-3 font-comfortaa' style={{color: '#459071'}}>
          {selectedCourse ? `Ready to learn ${selectedCourse === 'nodejs' ? 'Node.js' : selectedCourse === 'python' ? 'Python' : 'Programming'}?` : 'Welcome to FlowMind'}
        </h2>
        <p className='text-base mb-6 leading-relaxed' style={{color: '#4ea674'}}>
          {selectedCourse 
            ? `Let's explore ${selectedCourse === 'nodejs' ? 'Node.js development' : selectedCourse === 'python' ? 'Python programming' : 'programming concepts'} together. Ask me anything!`
            : 'Your intelligent programming assistant for Node.js and Python'
          }
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
          <div className='relative'>
            {/* Enhanced gradient background */}
            <div className='absolute -inset-0.5 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-xl opacity-60 blur-sm animate-pulse transition-opacity duration-300'></div>

            <div className='relative flex items-center bg-white/98 rounded-xl px-3 py-2.5 shadow-lg transition-all duration-300'>
              <textarea
                value={input + (isListening && interimTranscript ? (input ? ' ' : '') + interimTranscript : '')}
                onChange={(e) => {
                  // Only allow manual changes when not listening
                  if (!isListening) {
                    setInput(e.target.value);
                  }
                }}
                placeholder={
                  isListening
                    ? `Listening... ${interimTranscript ? 'Processing speech...' : 'Speak now!'}`
                    : selectedCourse 
                      ? `Ask me anything about ${selectedCourse === 'nodejs' ? 'Node.js development' : selectedCourse === 'python' ? 'Python programming' : 'programming'}...`
                      : 'Ask me about Node.js or Python programming...'
                }
                rows={1}
                disabled={isSubmitting}
                className={`flex-1 bg-transparent resize-none focus:outline-none text-base transition-all duration-300 ${
                  isSubmitting
                    ? 'cursor-not-allowed'
                    : isListening
                      ? 'cursor-default'
                      : ''
                }`}
                style={{ 
                  minHeight: '20px', 
                  maxHeight: '100px',
                  overflow: (input + (isListening && interimTranscript ? ' ' + interimTranscript : '')).split('\n').length > 3 ? 'auto' : 'hidden',
                  color: isSubmitting ? '#9ca3af' : isListening ? '#7c3aed' : '#1f2937',
                  caretColor: '#459071',
                  backgroundColor: isListening ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && !isListening) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              
              {/* Speech Recognition with Wave Animation */}
              <div className="flex items-center ml-2 space-x-2">
                <SpeechRecognitionButton
                  isListening={isListening}
                  isDisabled={isSubmitting}
                  hasSupport={hasRecognitionSupport}
                  onClick={handleMicClick}
                  size="md"
                  variant="default"
                  isProcessing={isSubmitting}
                />
                
                {/* Animated Wave Visualization */}
                {isListening && (
                  <WaveAnimation 
                    isActive={isListening} 
                    size="sm" 
                    color="rgb(147 51 234)" 
                    className="opacity-90"
                  />
                )}
              </div>

              <motion.button
                type='submit'
                disabled={isSubmitting || !input.trim()}
                whileHover={{
                  scale: isSubmitting || !input.trim() ? 1 : 1.1,
                  boxShadow:
                    isSubmitting || !input.trim()
                      ? 'none'
                      : '0 10px 20px rgba(139, 92, 246, 0.4)',
                }}
                whileTap={{ scale: isSubmitting || !input.trim() ? 1 : 0.9 }}
                className={`ml-2 p-2 rounded-lg transition-all duration-300 ${
                  !isSubmitting && input.trim()
                    ? 'shadow-lg cursor-pointer'
                    : 'cursor-not-allowed opacity-50'
                }`}
                style={!isSubmitting && input.trim()
                  ? {backgroundColor: '#4ea674', color: 'white', boxShadow: '0 10px 25px rgba(78, 166, 116, 0.5)'}
                  : {backgroundColor: '#bde0ca', color: '#5fad81'}
                }>
                <Send className='w-3.5 h-3.5' />
              </motion.button>
            </div>
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
}) => {
  // Define color variations for each suggestion type
  const getCardColors = (index: number) => {
    const colorSchemes = [
      {
        iconBg: '#f0f9f4', // green-50 equivalent
        iconColor: '#16a34a', // green-600
        borderColor: '#d1fae5', // green-200
        borderHoverColor: '#4ade80', // green-400
        shadowColor: 'rgba(34, 197, 94, 0.2)' // green-500 with opacity
      },
      {
        iconBg: '#f0f4ff', // blue-50 equivalent
        iconColor: '#2563eb', // blue-600
        borderColor: '#bfdbfe', // blue-200
        borderHoverColor: '#60a5fa', // blue-400
        shadowColor: 'rgba(37, 99, 235, 0.2)' // blue-600 with opacity
      },
      {
        iconBg: '#fef7f0', // orange-50 equivalent
        iconColor: '#ea580c', // orange-600
        borderColor: '#fed7aa', // orange-200
        borderHoverColor: '#fb923c', // orange-400
        shadowColor: 'rgba(234, 88, 12, 0.2)' // orange-600 with opacity
      },
      {
        iconBg: '#f3f4f6', // purple-50 equivalent
        iconColor: '#7c3aed', // purple-600
        borderColor: '#e9d5ff', // purple-200
        borderHoverColor: '#a855f7', // purple-500
        shadowColor: 'rgba(124, 58, 237, 0.2)' // purple-600 with opacity
      }
    ];
    return colorSchemes[index % colorSchemes.length];
  };

  const colors = getCardColors(index);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2 }}
      whileHover={{ 
        scale: disabled ? 1 : 1.02,
        boxShadow: disabled ? 'none' : `0 8px 25px ${colors.shadowColor}`
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={() => !disabled && onClick(suggestion.text)}
      disabled={disabled}
      className='p-4 bg-white/95 backdrop-blur-sm rounded-xl text-left transition-all duration-300 disabled:opacity-50'
      style={{
        border: `1.5px solid ${colors.borderColor}`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.borderHoverColor;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 12px 30px ${colors.shadowColor}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.borderColor;
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
        }
      }}>
      <div className='flex items-center space-x-4'>
        <div 
          className='w-10 h-10 rounded-xl flex items-center justify-center shadow-sm'
          style={{
            backgroundColor: colors.iconBg,
            border: `1px solid ${colors.borderColor}`
          }}>
          <suggestion.icon 
            className='w-5 h-5' 
            style={{ color: colors.iconColor }}
          />
        </div>
        <p className='text-sm font-semibold leading-relaxed' style={{color: '#374151'}}>
          {suggestion.text}
        </p>
      </div>
    </motion.button>
  );
};
