/**
 * Thread Sidebar Component
 * Shows thread list and management controls
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  MessageSquare, 
  MessageSquarePlus,
  Plus, 
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Users,
  Star,
  Archive
} from 'lucide-react';
import { ConversationThread } from '@/lib/threading/types';

interface ThreadSidebarProps {
  threads: ConversationThread[];
  currentThreadId: string;
  onThreadSwitch: (threadId: string) => void;
  onCreateBranch: (fromMessageId: string, branchName: string) => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, newName: string) => void;
  onToggleThreadVisibility: (threadId: string) => void;
  className?: string;
}

export default function ThreadSidebar({
  threads,
  currentThreadId,
  onThreadSwitch,
  onDeleteThread,
  onRenameThread,
  onToggleThreadVisibility,
  className = '',
}: ThreadSidebarProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleStartEdit = (thread: ConversationThread) => {
    setEditingThreadId(thread.id);
    setEditingName(thread.name);
  };

  const handleSaveEdit = () => {
    if (editingThreadId && editingName.trim()) {
      onRenameThread(editingThreadId, editingName.trim());
    }
    setEditingThreadId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingThreadId(null);
    setEditingName('');
  };

  const getThreadIcon = (thread: ConversationThread) => {
    if (thread.isMainThread) return <MessageSquare className="w-4 h-4" />;
    return <GitBranch className="w-4 h-4" />;
  };

  const getThreadColor = (thread: ConversationThread) => {
    if (thread.isMainThread) return 'bg-blue-500';
    if (!thread.isActive) return 'bg-slate-400';
    return 'bg-green-500';
  };

  const formatTimestamp = (date: Date | string) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const visibleThreads = threads
    .filter(thread => showArchived || thread.isActive)
    .sort((a, b) => {
      // Main thread first, then by last update
      if (a.isMainThread && !b.isMainThread) return -1;
      if (!a.isMainThread && b.isMainThread) return 1;
      const bDate = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      const aDate = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      return bDate.getTime() - aDate.getTime();
    });

  return (
    <div className={`bg-white border-r border-slate-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Conversation Threads</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`
                p-2 rounded-lg transition-colors
                ${showArchived ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:text-slate-700'}
              `}
              title={showArchived ? 'Hide archived threads' : 'Show archived threads'}
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 mt-1">
          {visibleThreads.length} thread{visibleThreads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {visibleThreads.map(thread => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`
                relative group border-l-4 transition-all duration-200
                ${thread.id === currentThreadId 
                  ? 'border-l-purple-500 bg-purple-50' 
                  : 'border-l-transparent hover:border-l-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onThreadSwitch(thread.id)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getThreadColor(thread)}`} />
                      {getThreadIcon(thread)}
                      
                      {editingThreadId === thread.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 text-sm font-medium bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-slate-800 truncate">
                          {thread.name}
                        </h3>
                      )}

                      {thread.isMainThread && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Main
                        </span>
                      )}
                    </div>

                    {thread.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                        {thread.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{thread.messageCount}</span>
                        </div>
                        
                        {thread.branchedFrom && (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-3 h-3" />
                            <span>Branched</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(thread.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Thread Actions */}
                  <div className="relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <details className="relative">
                        <summary className="cursor-pointer p-1 hover:bg-slate-200 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </summary>
                        
                        <div className="absolute right-0 top-6 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => handleStartEdit(thread)}
                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors flex items-center space-x-2"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>
                          
                          <button
                            onClick={() => onToggleThreadVisibility(thread.id)}
                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors flex items-center space-x-2"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{thread.isActive ? 'Archive' : 'Restore'}</span>
                          </button>

                          {!thread.isMainThread && (
                            <button
                              onClick={() => onDeleteThread(thread.id)}
                              className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {visibleThreads.length === 0 && (
          <div className="p-8 text-center">
            <MessageSquarePlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-slate-600 mb-2">
              {showArchived ? 'No archived threads' : 'No threads yet'}
            </h3>
            <p className="text-xs text-slate-500">
              {showArchived 
                ? 'All threads are currently active' 
                : 'Continue the conversation to enable threading features'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Active Threads</span>
            <span className="font-medium">
              {threads.filter(t => t.isActive).length}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Total Messages</span>
            <span className="font-medium">
              {threads.reduce((sum, t) => sum + t.messageCount, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}