// components/chat/MessageDetailPanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Check, MessageSquare, Clock, User, Bot, Sparkles, Info } from 'lucide-react';
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

  const formatAsMarkdown = (content: string, role: string, timestamp: Date) => {
    const timeStr = timestamp.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const sender = role === 'assistant' ? 'FlowMind' : 'You';
    
    return `# ${sender}
*${timeStr}*

${content}

---
*Generated with FlowMind Chat*`;
  };

  const handleCopy = async () => {
    if (!message) return;
    try {
      const markdownContent = formatAsMarkdown(message.content, message.role, message.timestamp);
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleDownload = () => {
    if (!message) return;
    const markdownContent = formatAsMarkdown(message.content, message.role, message.timestamp);
    const element = document.createElement('a');
    const file = new Blob([markdownContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `flowmind-message-${Date.now()}.md`;
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
    <motion.div
      initial={{ x: '100%', opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: '100%', opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.3 },
        scale: { duration: 0.35 }
      }}
      className="w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 h-full"
    >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center space-x-3">
                {message ? (
                  <>
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
                      <h2 className="text-lg font-semibold text-slate-800">
                        {message.role === 'assistant' ? 'FlowMind' : 'You'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {message.timestamp ? formatTimestamp(message.timestamp) : 'Just now'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Message Details</h2>
                      <p className="text-xs text-slate-500">Select a message to view</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Action buttons - Copy and Download */}
                {message && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                      onClick={handleCopy}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        copied
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'hover:bg-blue-100 text-slate-600 hover:text-blue-700'
                      }`}
                      title={copied ? 'Copied!' : 'Copy message'}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                      onClick={handleDownload}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors duration-200 text-slate-600 hover:text-purple-700"
                      title="Download as text file"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </>
                )}

                {/* Message Information Hover Icon */}
                {message && (
                  <div className="relative group">
                    <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <Info className="w-4 h-4 text-slate-500" />
                    </button>
                    
                    {/* Hover Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="text-sm">
                        <h4 className="font-medium text-slate-800 mb-2">Message Information</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-600">ID:</span>
                            <span className="font-mono text-xs text-slate-500 truncate ml-2">{message.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Role:</span>
                            <span className="capitalize font-medium text-slate-700">{message.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Time:</span>
                            <span className="text-slate-700 text-xs">{formatTimestamp(message.timestamp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Length:</span>
                            <span className="text-slate-700">{message.content.length} chars</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Close panel"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

        {message ? (
              <div className="flex-1 overflow-y-auto">
                {/* Message Content */}
                <div className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <EnhancedMessageRenderer content={message.content} role={message.role} />
                  </div>
                </div>

                {/* Sources Panel removed - now only shown on left side */}
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
  );
}