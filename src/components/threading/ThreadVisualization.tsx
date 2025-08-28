/**
 * Thread Visualization Component
 * Displays conversation threads as an interactive tree/graph
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  MessageSquare, 
  User, 
  Bot, 
  MoreHorizontal,
  Trash2,
  Edit3,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  Clock
} from 'lucide-react';
import { ConversationThread, MessageTrace, ThreadVisualizationNode } from '@/lib/threading/types';

interface ThreadVisualizationProps {
  threads: ConversationThread[];
  traces: Map<string, MessageTrace>;
  currentThreadId: string;
  onThreadSwitch: (threadId: string) => void;
  onCreateBranch: (messageId: string, branchName: string) => void;
  onRegenerateMessage: (messageId: string) => void;
  onDeleteThread: (threadId: string) => void;
  messages: any[]; // Message data
  className?: string;
}

export default function ThreadVisualization({
  threads,
  traces,
  currentThreadId,
  onThreadSwitch,
  onCreateBranch,
  onRegenerateMessage,
  onDeleteThread,
  messages,
  className = '',
}: ThreadVisualizationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showInactiveThreads, setShowInactiveThreads] = useState(false);
  const [branchingFromNode, setBranchingFromNode] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');

  // Convert threads and traces to visualization nodes
  const visualizationNodes = useMemo(() => {
    const nodes: ThreadVisualizationNode[] = [];
    const messageMap = new Map(messages.map(m => [m.id, m]));

    threads
      .filter(thread => showInactiveThreads || thread.isActive)
      .forEach((thread, threadIndex) => {
        const threadTraces = Array.from(traces.values())
          .filter(trace => trace.threadId === thread.id)
          .sort((a, b) => a.depth - b.depth);

        threadTraces.forEach((trace, messageIndex) => {
          const message = messageMap.get(trace.messageId);
          if (!message) return;

          const node: ThreadVisualizationNode = {
            id: trace.messageId,
            messageId: trace.messageId,
            content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            role: message.role,
            timestamp: message.timestamp,
            x: threadIndex * 300 + (trace.depth % 3) * 50, // Spread threads horizontally
            y: trace.depth * 120, // Vertical progression
            isActive: thread.id === currentThreadId,
            threadId: thread.id,
            children: trace.childMessageIds,
            parent: trace.parentMessageId,
          };

          nodes.push(node);
        });
      });

    return nodes;
  }, [threads, traces, messages, currentThreadId, showInactiveThreads]);

  // Group nodes by thread for better rendering
  const nodesByThread = useMemo(() => {
    const grouped = new Map<string, ThreadVisualizationNode[]>();
    
    visualizationNodes.forEach(node => {
      if (!grouped.has(node.threadId)) {
        grouped.set(node.threadId, []);
      }
      grouped.get(node.threadId)!.push(node);
    });

    return grouped;
  }, [visualizationNodes]);

  const handleCreateBranch = useCallback(() => {
    if (branchingFromNode && newBranchName.trim()) {
      onCreateBranch(branchingFromNode, newBranchName.trim());
      setBranchingFromNode(null);
      setNewBranchName('');
    }
  }, [branchingFromNode, newBranchName, onCreateBranch]);

  const getThreadColor = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread?.isMainThread) return 'from-blue-500 to-purple-600';
    
    const colors = [
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600', 
      'from-purple-500 to-pink-600',
      'from-indigo-500 to-blue-600',
      'from-yellow-500 to-orange-600',
    ];
    
    const index = threads.findIndex(t => t.id === threadId);
    return colors[index % colors.length];
  };

  const renderConnection = (fromNode: ThreadVisualizationNode, toNode: ThreadVisualizationNode) => {
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    
    return (
      <motion.path
        key={`${fromNode.id}-${toNode.id}`}
        d={`M ${fromNode.x + 200} ${fromNode.y + 60} Q ${midX} ${midY} ${toNode.x + 100} ${toNode.y + 20}`}
        stroke="rgba(139, 92, 246, 0.3)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
    );
  };

  const renderMessageNode = (node: ThreadVisualizationNode) => {
    const thread = threads.find(t => t.id === node.threadId);
    const isSelected = selectedNodeId === node.id;
    const trace = traces.get(node.messageId);

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: 'absolute',
          left: node.x,
          top: node.y,
          width: '280px',
        }}
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'z-20' : 'z-10'
        }`}
        onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
      >
        <div className={`
          relative p-4 rounded-lg border-2 transition-all duration-200
          ${isSelected ? 'border-purple-400 shadow-lg' : 'border-slate-200 shadow-md'}
          ${node.isActive ? 'bg-purple-50' : 'bg-white'}
        `}>
          {/* Thread indicator */}
          <div className={`absolute -left-2 top-2 w-4 h-4 rounded-full bg-gradient-to-r ${getThreadColor(node.threadId)}`} />
          
          {/* Message header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {node.role === 'user' ? (
                <User className="w-4 h-4 text-purple-600" />
              ) : (
                <Bot className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {node.role === 'user' ? 'You' : 'FlowMind'}
              </span>
              {trace?.metadata.regenerated && (
                <RefreshCw className="w-3 h-3 text-orange-500" />
              )}
              {trace?.metadata.alternativeResponse && (
                <GitBranch className="w-3 h-3 text-green-500" />
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">
                {node.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Message content */}
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {node.content}
          </p>

          {/* Thread info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {thread?.name || 'Unknown Thread'}
              {trace?.depth !== undefined && ` • Depth ${trace.depth}`}
            </span>
            {node.children.length > 0 && (
              <span className="flex items-center">
                <ArrowRight className="w-3 h-3 mr-1" />
                {node.children.length}
              </span>
            )}
          </div>

          {/* Action buttons (shown when selected) */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -bottom-12 left-0 right-0 flex justify-center space-x-2"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBranchingFromNode(node.id);
                  }}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors"
                  title="Create branch"
                >
                  <GitBranch className="w-3 h-3" />
                </button>
                
                {node.role === 'assistant' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerateMessage(node.id);
                    }}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-colors"
                    title="Regenerate response"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}

                {thread && !thread.isMainThread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
        <button
          onClick={() => setShowInactiveThreads(!showInactiveThreads)}
          className={`
            p-2 rounded-lg transition-colors
            ${showInactiveThreads ? 'bg-purple-100 text-purple-700' : 'bg-white text-slate-600'}
          `}
          title={showInactiveThreads ? 'Hide inactive threads' : 'Show inactive threads'}
        >
          {showInactiveThreads ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Thread Legend */}
      <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-md p-3 max-w-xs">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Active Threads</h3>
        <div className="space-y-2">
          {threads.filter(t => showInactiveThreads || t.isActive).map(thread => (
            <div
              key={thread.id}
              className={`
                flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors
                ${thread.id === currentThreadId ? 'bg-purple-100' : 'hover:bg-slate-50'}
              `}
              onClick={() => onThreadSwitch(thread.id)}
            >
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getThreadColor(thread.id)}`} />
              <span className="text-xs font-medium text-slate-700">{thread.name}</span>
              <span className="text-xs text-slate-500">({thread.messageCount})</span>
              {thread.isMainThread && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Main</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {visualizationNodes.map(node => 
          node.children.map(childId => {
            const childNode = visualizationNodes.find(n => n.id === childId);
            return childNode ? renderConnection(node, childNode) : null;
          })
        ).flat().filter(Boolean)}
      </svg>

      {/* Message nodes */}
      <div className="relative w-full h-full overflow-auto">
        <AnimatePresence>
          {visualizationNodes.map(renderMessageNode)}
        </AnimatePresence>
      </div>

      {/* Branch creation modal */}
      <AnimatePresence>
        {branchingFromNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setBranchingFromNode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Branch</h3>
              
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Enter branch name..."
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setBranchingFromNode(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                  Create Branch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {visualizationNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No conversation threads</h3>
            <p className="text-slate-500">Start a conversation to see thread visualization</p>
          </div>
        </div>
      )}
    </div>
  );
}