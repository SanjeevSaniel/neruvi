// components/chat/ChatInput.tsx
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import SpeechRecognitionButton from '@/components/ui/SpeechRecognitionButton';
import SpeechStatus from '@/components/ui/SpeechStatus';

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
  const [showSpeechError, setShowSpeechError] = useState(false);
  
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Handle final transcript - only add to input when speech recognition stops
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && !isListening) {
      // Add final transcript to current input value
      const newText = value + (value ? ' ' : '') + finalTranscript.trim();
      onChange(newText);
      resetTranscript();
    }
  }, [finalTranscript, isListening, value, onChange, resetTranscript]);

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      setShowSpeechError(true);
      setTimeout(() => setShowSpeechError(false), 3000);
    }
  }, [speechError]);

  // Stop speech recognition when assistant is processing
  useEffect(() => {
    if (isLoading && isListening) {
      stopListening();
    }
  }, [isLoading, isListening, stopListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;

    // Stop any ongoing speech recognition
    if (isListening) {
      stopListening();
    }

    await onSubmit(value);
    onChange('');
  };

  const handleMicClick = () => {
    // Don't allow mic interaction when assistant is processing
    if (isLoading) {
      return;
    }

    if (!hasRecognitionSupport) {
      setShowSpeechError(true);
      setTimeout(() => setShowSpeechError(false), 3000);
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
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
      className='p-4'>
      <form
        onSubmit={handleSubmit}
        className='max-w-2xl mx-auto'>
        <div className='relative'>
          {/* Enhanced gradient background with hover effects */}
          <div className='absolute -inset-0.5 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-xl opacity-60 blur-sm animate-pulse group-hover:opacity-80 transition-opacity duration-300'></div>

          <motion.div
            className='relative flex items-center bg-white/98 rounded-xl px-3 py-2.5 shadow-lg hover:shadow-2xl focus-within:shadow-2xl transition-all duration-300 group'>
            <textarea
              ref={textareaRef}
              value={value + (isListening && interimTranscript ? (value ? ' ' : '') + interimTranscript : '')}
              onChange={(e) => {
                // Only allow manual changes when not listening
                if (!isListening) {
                  onChange(e.target.value);
                }
              }}
              placeholder={isListening ? `Listening... ${interimTranscript ? 'Processing speech...' : 'Speak now!'}` : placeholder}
              rows={1}
              disabled={disabled}
              className={`flex-1 bg-transparent resize-none focus:outline-none text-base transition-all duration-300 ${
                disabled
                  ? 'text-gray-400 placeholder-gray-400 cursor-not-allowed'
                  : isListening
                    ? 'text-purple-700 placeholder-purple-500 cursor-default'
                    : 'text-purple-900 placeholder-purple-500 hover:placeholder-purple-600'
              } ${
                isListening ? 'bg-purple-50/50' : ''
              }`}
              style={{ 
                minHeight: '20px', 
                maxHeight: '100px',
                overflow: (value + (isListening && interimTranscript ? ' ' + interimTranscript : '')).split('\n').length > 3 ? 'auto' : 'hidden'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !disabled && !isListening) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            
            {/* Speech Recognition Button */}
            <SpeechRecognitionButton
              isListening={isListening}
              isDisabled={disabled || isLoading}
              hasSupport={hasRecognitionSupport}
              onClick={handleMicClick}
              className="ml-2"
              size="md"
              variant="default"
              isProcessing={isLoading}
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
          
          {/* Speech Status Component */}
          <SpeechStatus
            isListening={isListening}
            error={speechError}
            hasSupport={hasRecognitionSupport}
            showError={showSpeechError}
            position="top"
          />
        </div>
      </form>
    </motion.div>
  );
}
