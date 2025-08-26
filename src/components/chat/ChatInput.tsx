// components/chat/ChatInput.tsx
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import SpeechRecognitionButton from '@/components/ui/SpeechRecognitionButton';
import SpeechStatus from '@/components/ui/SpeechStatus';
import WaveAnimation from '@/components/ui/WaveAnimation';

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
                  ? 'cursor-not-allowed'
                  : isListening
                    ? 'cursor-default'
                    : ''
              }`}
              style={{ 
                minHeight: '20px', 
                maxHeight: '100px',
                overflow: (value + (isListening && interimTranscript ? ' ' + interimTranscript : '')).split('\n').length > 3 ? 'auto' : 'hidden',
                color: disabled ? '#9ca3af' : isListening ? '#7c3aed' : '#1f2937',
                caretColor: '#459071',
                backgroundColor: isListening ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                '--placeholder-color': disabled ? '#9ca3af' : '#459071'
              } as React.CSSProperties & { '--placeholder-color': string }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !disabled && !isListening) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            
            {/* Speech Recognition with Wave Animation */}
            <div className="flex items-center ml-2 space-x-2">
              <SpeechRecognitionButton
                isListening={isListening}
                isDisabled={disabled || isLoading}
                hasSupport={hasRecognitionSupport}
                onClick={handleMicClick}
                size="md"
                variant="default"
                isProcessing={isLoading}
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
                  ? 'shadow-lg hover:shadow-xl cursor-pointer'
                  : 'cursor-not-allowed opacity-50'
              }`}
              style={!isLoading && value.trim() && !disabled
                ? {backgroundColor: '#4ea674', color: 'white', boxShadow: '0 10px 25px rgba(78, 166, 116, 0.5)'}
                : {backgroundColor: '#bde0ca', color: '#5fad81'}
              }>
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
