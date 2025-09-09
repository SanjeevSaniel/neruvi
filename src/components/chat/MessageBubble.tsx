// components/chat/MessageBubble.tsx
import { motion } from 'framer-motion';
import { Sparkles, Copy, Download, Check, User, Bot, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import EnhancedMessageRenderer from './EnhancedMessageRenderer';
import SourcePanel from './SourcePanel';
import { Message } from './types';

interface MessageBubbleProps {
  message: Message;
  index: number;
  onClick?: (message: Message) => void;
  isCompactMode?: boolean;
  isSelected?: boolean;
}

export default function MessageBubble({ message, index, onClick, isCompactMode, isSelected }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  
  // Debug sources
  console.log(`🔍 MessageBubble - Message sources:`, {
    messageId: message.id,
    messageRole: message.role,
    sources: message.sources,
    sourcesLength: message.sources?.length || 0
  });
  
  // Filter sources to show the most relevant single reference (same logic as SourcePanel)
  const getFilteredSources = (sources: typeof message.sources) => {
    if (!sources || sources.length === 0) return [];
    console.log(`🔍 MessageBubble - Raw sources before filtering:`, sources);
    
    // Sources from API are already sorted by score (highest first)
    // Apply consistent filtering and take the best match
    const filtered = sources
      .filter(source => {
        const relevanceMatch = source.relevance.match(/(\d+)%?/);
        if (relevanceMatch) {
          const percentage = parseInt(relevanceMatch[1]);
          const passesFilter = percentage >= 35; // Consistent threshold for quality sources
          console.log(`🔍 MessageBubble - Source relevance check:`, {
            relevance: source.relevance,
            percentage,
            passesFilter,
            section: source.section,
            timestamp: source.timestamp
          });
          return passesFilter;
        }
        console.log(`🔍 MessageBubble - Source without percentage (keeping):`, {
          relevance: source.relevance,
          section: source.section,
          timestamp: source.timestamp
        });
        return true; // Keep sources without percentage (assume they're relevant)
      })
      .sort((a, b) => {
        // Sort by relevance score, highest first, with tie-breakers for deterministic results
        const aMatch = a.relevance.match(/(\d+)%?/);
        const bMatch = b.relevance.match(/(\d+)%?/);
        const aScore = aMatch ? parseInt(aMatch[1]) : 100; // Default high score for non-percentage
        const bScore = bMatch ? parseInt(bMatch[1]) : 100; // Default high score for non-percentage
        
        if (bScore !== aScore) {
          return bScore - aScore; // Higher score first
        }
        
        // If scores are equal, prefer earlier timestamps (more foundational content)
        const aTime = a.timestamp.split(':').map(Number);
        const bTime = b.timestamp.split(':').map(Number);
        const aSeconds = (aTime[0] || 0) * 60 + (aTime[1] || 0);
        const bSeconds = (bTime[0] || 0) * 60 + (bTime[1] || 0);
        return aSeconds - bSeconds;
      })
      .slice(0, 1); // Take only the single best match
      
    console.log(`🔍 MessageBubble - After filtering and sorting (best match):`, filtered);
    return filtered;
  };

  const filteredSources = getFilteredSources(message.sources);
  console.log(`🔍 MessageBubble - Filtered sources:`, {
    messageId: message.id,
    filteredSources,
    filteredLength: filteredSources.length
  });
  
  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) {
      return 'Just now';
    }

    const now = new Date();
    const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if timestampDate is valid
    if (isNaN(timestampDate.getTime())) {
      console.warn('Invalid timestamp for message:', message.id);
      return 'Just now';
    }

    const diffInMinutes = Math.floor((now.getTime() - timestampDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes <= 0) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    return timestampDate.toLocaleTimeString('en-US', {
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

  const stripMarkdown = (content: string) => {
    return content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '[code block]')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove headers
      .replace(/^#{1,6}\s+(.*)$/gm, '$1')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '• ')
      // Remove numbered lists
      .replace(/^\s*\d+\.\s+/gm, '• ')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const getPreviewText = (content: string, maxLength: number = 150) => {
    const plainText = stripMarkdown(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (isCompactMode) {
    // Compact card mode maintaining original conversation alignment
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.1 }}
        className='space-y-2'>
        
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
            
            {/* Message Header - Same as original */}
            <div className={`flex items-center mb-2 ${
              message.role === 'user' ? 'justify-end space-x-2' : 'justify-start space-x-2'
            }`}>
              {message.role === 'assistant' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='w-8 h-8 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg'
                >
                  <Sparkles className='w-4 h-4' style={{color: 'white'}} />
                </motion.div>
              )}
              <span className={`text-sm font-semibold ${
                message.role === 'user' ? 'order-1 text-purple-700' : 'text-purple-700 font-comfortaa'
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
                  <User className='w-4 h-4' style={{color: 'white'}} />
                </motion.div>
              )}
            </div>

            {/* Compact Message Card - Original conversation style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => message.role === 'assistant' && onClick?.(message)}
              className={`relative px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                message.role === 'assistant' ? 'cursor-pointer' : 'cursor-default'
              } ${
                message.role === 'user'
                  ? `ml-6 ${
                      isSelected ? 'ring-2 ring-green-300 ring-offset-2' : ''
                    }`
                  : `bg-white border shadow-lg ${
                      isSelected 
                        ? 'border-green-400 ring-2 ring-green-200 ring-offset-1 bg-green-50' 
                        : 'border-slate-200'
                    }`
              }`}
              style={message.role === 'user' ? {
                background: 'linear-gradient(to bottom right, rgba(78, 166, 116, 0.9), rgba(69, 144, 113, 0.9))',
                boxShadow: '0 4px 6px rgba(78, 166, 116, 0.2)'
              } : {}}>
              <div className="flex items-start justify-between">
                <div className={`flex-1 text-sm leading-relaxed overflow-hidden pr-3`}
                     style={{
                       color: message.role === 'user' ? 'white' : '#64748b',
                       display: '-webkit-box',
                       WebkitLineClamp: 3,
                       WebkitBoxOrient: 'vertical'
                     }}>
                  {getPreviewText(message.content, 200)}
                  
                  {filteredSources.length > 0 && (
                    <div className={`mt-2 text-xs flex items-center space-x-1`}
                         style={{color: message.role === 'user' ? '#dcefe2' : '#4ea674'}}>
                      <span>1 source</span>
                      <span className="text-slate-400">• Click for details</span>
                    </div>
                  )}
                </div>
                
                {/* Enhanced click indicator - Only for assistant messages */}
                {message.role === 'assistant' && (
                  <motion.div 
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-full transition-all duration-200 group/arrow shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: ["0 2px 4px rgba(139, 92, 246, 0.1)", "0 4px 8px rgba(139, 92, 246, 0.2)", "0 2px 4px rgba(139, 92, 246, 0.1)"]
                    }}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                    }}
                    title="Click to view detailed analysis and sources"
                  >
                    <motion.div
                      animate={{ x: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <ChevronRight className="w-4 h-4 text-purple-600 group-hover/arrow:text-purple-700 transition-colors" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Source Panel for Assistant Messages - Only show when filtered sources exist */}
            {(() => {
              const shouldShow = message.role === 'assistant' && filteredSources.length > 0;
              console.log(`💬 SourcePanel render decision:`, {
                messageRole: message.role,
                filteredSourcesLength: filteredSources.length,
                shouldShow,
                messageId: message.id,
                filteredSources
              });
              return shouldShow ? (
                <>
                  {console.log(`💬 Rendering SourcePanel with ${filteredSources.length} sources:`, filteredSources)}
                  <SourcePanel sources={filteredSources} />
                </>
              ) : null;
            })()}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full mode (original layout)
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
              message.role === 'user' ? 'order-1 text-purple-700' : 'text-purple-700 font-comfortaa'
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
            whileHover={{ scale: 1.01, boxShadow: message.role === 'user' ? '0 8px 25px rgba(78, 166, 116, 0.15)' : '0 8px 25px rgba(139, 92, 246, 0.15)' }}
            onClick={() => message.role === 'assistant' && onClick?.(message)}
            className={`relative group px-5 py-4 rounded-2xl shadow-md transition-all duration-200 ${
              message.role === 'assistant' ? 'cursor-pointer' : 'cursor-default'
            } ${
              message.role === 'user'
                ? 'ml-6'
                : 'bg-white border border-slate-200 shadow-lg hover:border-green-200 hover:shadow-xl'
            }`}
            style={message.role === 'user' ? {
              background: 'linear-gradient(to bottom right, rgba(78, 166, 116, 0.9), rgba(69, 144, 113, 0.9))',
              color: 'white',
              boxShadow: '0 4px 6px rgba(78, 166, 116, 0.2)'
            } : {}}>
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

          {/* Source Panel for Assistant Messages - Only show when filtered sources exist */}
          {(() => {
            const shouldShow = message.role === 'assistant' && filteredSources.length > 0;
            console.log(`💬 Full mode SourcePanel render decision:`, {
              messageRole: message.role,
              filteredSourcesLength: filteredSources.length,
              shouldShow,
              messageId: message.id,
              filteredSources
            });
            return shouldShow ? (
              <>
                {console.log(`💬 Full mode Rendering SourcePanel with ${filteredSources.length} sources:`, filteredSources)}
                <SourcePanel sources={filteredSources} />
              </>
            ) : null;
          })()}
        </div>
      </div>
    </motion.div>
  );
}
