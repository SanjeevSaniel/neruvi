// components/chat/MessageDetailPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Check, MessageSquare, Clock, User, Bot, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Message } from './types';
import EnhancedMessageRenderer from './EnhancedMessageRenderer';
import SourcePanel from './SourcePanel';

interface MessageDetailPanelProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageDetailPanel({ message, isOpen, onClose }: MessageDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleDownload = () => {
    if (!message) return;
    const element = document.createElement('a');
    const file = new Blob([message.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `flowmind-message-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 200,
            duration: 0.3 
          }}
          className="w-96 xl:w-[28rem] bg-white shadow-2xl flex flex-col border-l border-slate-200 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Message Details</h2>
                  <p className="text-xs text-slate-500">Detailed view and actions</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Close panel"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {message ? (
              <div className="flex-1 overflow-y-auto">
                {/* Message Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3 mb-3">
                    {message.role === 'assistant' ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {message.role === 'assistant' ? 'FlowMind' : 'You'}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        copied
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownload}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </motion.button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <EnhancedMessageRenderer content={message.content} role={message.role} />
                  </div>
                </div>

                {/* Sources Panel */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="p-4 border-t border-slate-100">
                    <SourcePanel sources={message.sources} />
                  </div>
                )}

                {/* Message Metadata */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3">Message Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Message ID:</span>
                      <span className="font-mono text-xs text-slate-500">{message.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Role:</span>
                      <span className="capitalize font-medium text-slate-700">{message.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Timestamp:</span>
                      <span className="text-slate-700">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Content Length:</span>
                      <span className="text-slate-700">{message.content.length} characters</span>
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sources:</span>
                        <span className="text-slate-700">{message.sources.length} references</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No Message Selected</h3>
                  <p className="text-sm text-slate-500">Click on a message in the chat to view details</p>
                </div>
              </div>
            )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}