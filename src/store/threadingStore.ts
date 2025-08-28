/**
 * Threading Store - Zustand store for conversation threading state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ConversationThread, MessageTrace, ThreadVisualizationNode } from '@/lib/threading/types';
import { ThreadingEngine } from '@/lib/threading/engine';
import { ThreadingDatabaseService } from '@/lib/threading/database-service';

interface ThreadingState {
  // Current state
  currentThreadId: string | null;
  threads: ConversationThread[];
  traces: Map<string, MessageTrace>;
  
  // UI state
  showThreadSidebar: boolean;
  showThreadVisualization: boolean;
  selectedThreadId: string | null;
  
  // Services
  engine: ThreadingEngine;
  databaseService: ThreadingDatabaseService;
  
  // Actions
  initializeConversationThreading: (conversationId: string, firstMessageId?: string) => Promise<void>;
  createBranch: (fromMessageId: string, branchName: string) => Promise<string>;
  switchThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  renameThread: (threadId: string, newName: string) => Promise<void>;
  toggleThreadVisibility: (threadId: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<string>;
  
  // Message tracing
  addMessageTrace: (messageId: string, threadId: string, parentMessageId: string | null) => Promise<void>;
  getMessageLineage: (messageId: string) => MessageTrace[];
  
  // UI actions
  setShowThreadSidebar: (show: boolean) => void;
  setShowThreadVisualization: (show: boolean) => void;
  setSelectedThread: (threadId: string | null) => void;
  
  // Data loading
  loadConversationThreads: (conversationId: string) => Promise<void>;
  refreshThreadData: () => Promise<void>;
}

export const useThreadingStore = create<ThreadingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentThreadId: null,
    threads: [],
    traces: new Map(),
    
    // UI state
    showThreadSidebar: false,
    showThreadVisualization: false,
    selectedThreadId: null,
    
    // Services
    engine: new ThreadingEngine(),
    databaseService: new ThreadingDatabaseService(),
    
    // Initialize threading for a conversation
    initializeConversationThreading: async (conversationId: string, firstMessageId?: string) => {
      const { engine, databaseService } = get();
      
      try {
        // Initialize engine
        const mainThreadId = await engine.initializeConversation(conversationId, firstMessageId);
        
        // Save to database
        if (firstMessageId) {
          const mainThread = engine.getConversationThreads(conversationId)[0];
          const dbThreadId = await databaseService.createThread({
            conversationId: mainThread.conversationId,
            name: mainThread.name,
            description: mainThread.description,
            rootMessageId: mainThread.rootMessageId,
            currentMessageId: mainThread.currentMessageId,
            messageCount: mainThread.messageCount,
            isMainThread: mainThread.isMainThread,
            isActive: mainThread.isActive,
          });
          
          // Update engine with database ID
          mainThread.id = dbThreadId;
        }
        
        // Update state
        set({
          currentThreadId: mainThreadId,
          threads: engine.getConversationThreads(conversationId),
        });
        
        console.log('🧵 Threading initialized for conversation:', conversationId);
      } catch (error) {
        console.error('❌ Error initializing threading:', error);
      }
    },
    
    // Create branch from message
    createBranch: async (fromMessageId: string, branchName: string) => {
      const { engine, databaseService, currentThreadId } = get();
      
      try {
        const newThreadId = await engine.createBranch(fromMessageId, branchName);
        const threads = engine.exportState().availableThreads;
        const newThread = threads.find(t => t.id === newThreadId);
        
        if (newThread) {
          // Save to database
          const dbThreadId = await databaseService.createThread({
            conversationId: newThread.conversationId,
            name: newThread.name,
            description: newThread.description,
            rootMessageId: newThread.rootMessageId,
            currentMessageId: newThread.currentMessageId,
            messageCount: newThread.messageCount,
            isMainThread: newThread.isMainThread,
            isActive: newThread.isActive,
            branchedFrom: newThread.branchedFrom,
          });
          
          // Update thread with database ID
          newThread.id = dbThreadId;
          
          // Log action
          await databaseService.logThreadAction(
            newThread.conversationId,
            'CREATE_BRANCH',
            { messageId: fromMessageId, branchName },
            'current_user', // Would get from auth context
            newThreadId,
            fromMessageId
          );
        }
        
        set({
          threads: engine.exportState().availableThreads,
        });
        
        return newThreadId;
      } catch (error) {
        console.error('❌ Error creating branch:', error);
        throw error;
      }
    },
    
    // Switch to different thread
    switchThread: async (threadId: string) => {
      const { engine, databaseService } = get();
      
      try {
        await engine.switchThread(threadId);
        const thread = engine.exportState().availableThreads.find(t => t.id === threadId);
        
        if (thread) {
          await databaseService.updateThread(threadId, {
            updatedAt: new Date(),
          });
          
          // Log action
          await databaseService.logThreadAction(
            thread.conversationId,
            'SWITCH_THREAD',
            { threadId },
            'current_user',
            threadId
          );
        }
        
        set({
          currentThreadId: threadId,
          selectedThreadId: threadId,
          threads: engine.exportState().availableThreads,
        });
      } catch (error) {
        console.error('❌ Error switching thread:', error);
      }
    },
    
    // Delete thread
    deleteThread: async (threadId: string) => {
      const { engine, databaseService } = get();
      
      try {
        const thread = engine.exportState().availableThreads.find(t => t.id === threadId);
        if (!thread || thread.isMainThread) {
          throw new Error('Cannot delete main thread');
        }
        
        // Mark as inactive in database
        await databaseService.updateThread(threadId, {
          isActive: false,
        });
        
        // Log action
        await databaseService.logThreadAction(
          thread.conversationId,
          'DELETE_THREAD',
          { threadId },
          'current_user',
          threadId
        );
        
        // Remove from engine state
        const state = engine.exportState();
        state.availableThreads = state.availableThreads.filter(t => t.id !== threadId);
        engine.importState(state);
        
        // Switch to main thread if we deleted the current thread
        const { currentThreadId } = get();
        if (currentThreadId === threadId) {
          const mainThread = state.availableThreads.find(t => t.isMainThread);
          if (mainThread) {
            set({ currentThreadId: mainThread.id });
          }
        }
        
        set({
          threads: state.availableThreads,
        });
      } catch (error) {
        console.error('❌ Error deleting thread:', error);
      }
    },
    
    // Rename thread
    renameThread: async (threadId: string, newName: string) => {
      const { engine, databaseService } = get();
      
      try {
        await databaseService.updateThread(threadId, {
          name: newName,
        });
        
        // Update engine state
        const state = engine.exportState();
        const thread = state.availableThreads.find(t => t.id === threadId);
        if (thread) {
          thread.name = newName;
          thread.updatedAt = new Date();
        }
        engine.importState(state);
        
        // Log action
        if (thread) {
          await databaseService.logThreadAction(
            thread.conversationId,
            'RENAME_THREAD',
            { threadId, oldName: thread.name, newName },
            'current_user',
            threadId
          );
        }
        
        set({
          threads: state.availableThreads,
        });
      } catch (error) {
        console.error('❌ Error renaming thread:', error);
      }
    },
    
    // Toggle thread visibility
    toggleThreadVisibility: async (threadId: string) => {
      const { engine, databaseService } = get();
      
      try {
        const state = engine.exportState();
        const thread = state.availableThreads.find(t => t.id === threadId);
        
        if (thread) {
          const newActiveState = !thread.isActive;
          
          await databaseService.updateThread(threadId, {
            isActive: newActiveState,
          });
          
          thread.isActive = newActiveState;
          thread.updatedAt = new Date();
          engine.importState(state);
          
          // Log action
          await databaseService.logThreadAction(
            thread.conversationId,
            newActiveState ? 'RESTORE_THREAD' : 'ARCHIVE_THREAD',
            { threadId },
            'current_user',
            threadId
          );
          
          set({
            threads: state.availableThreads,
          });
        }
      } catch (error) {
        console.error('❌ Error toggling thread visibility:', error);
      }
    },
    
    // Regenerate message
    regenerateMessage: async (messageId: string) => {
      const { engine, databaseService } = get();
      
      try {
        const newMessageId = await engine.regenerateMessage(messageId);
        const traces = engine.exportState().messageTraces;
        const newTrace = traces.get(newMessageId);
        
        if (newTrace) {
          // Save trace to database
          await databaseService.createMessageTrace(newTrace);
          
          // Log action
          await databaseService.logThreadAction(
            newTrace.conversationId,
            'REGENERATE_MESSAGE',
            { originalMessageId: messageId, newMessageId },
            'current_user',
            newTrace.threadId,
            messageId
          );
        }
        
        set({
          traces: new Map(traces),
        });
        
        return newMessageId;
      } catch (error) {
        console.error('❌ Error regenerating message:', error);
        throw error;
      }
    },
    
    // Add message trace
    addMessageTrace: async (messageId: string, threadId: string, parentMessageId: string | null) => {
      const { engine, databaseService } = get();
      
      try {
        const trace = await engine.createMessageTrace(messageId, threadId, parentMessageId);
        
        // Save to database
        await databaseService.createMessageTrace(trace);
        
        // Update message count in thread
        const state = engine.exportState();
        const thread = state.availableThreads.find(t => t.id === threadId);
        if (thread) {
          thread.messageCount++;
          thread.currentMessageId = messageId;
          thread.updatedAt = new Date();
          
          await databaseService.updateThread(threadId, {
            messageCount: thread.messageCount,
            currentMessageId: thread.currentMessageId,
          });
        }
        
        set({
          traces: new Map(state.messageTraces),
          threads: state.availableThreads,
        });
      } catch (error) {
        console.error('❌ Error adding message trace:', error);
      }
    },
    
    // Get message lineage
    getMessageLineage: (messageId: string) => {
      const { engine } = get();
      return engine.getMessageLineage(messageId);
    },
    
    // UI actions
    setShowThreadSidebar: (show: boolean) => set({ showThreadSidebar: show }),
    setShowThreadVisualization: (show: boolean) => set({ showThreadVisualization: show }),
    setSelectedThread: (threadId: string | null) => set({ selectedThreadId: threadId }),
    
    // Load conversation threads from database
    loadConversationThreads: async (conversationId: string) => {
      const { databaseService, engine } = get();
      
      try {
        const threads = await databaseService.getConversationThreads(conversationId);
        
        // Import into engine
        const state = engine.exportState();
        state.availableThreads = threads;
        
        // Set current thread to main thread or first active thread
        const mainThread = threads.find(t => t.isMainThread);
        const currentThread = mainThread || threads.find(t => t.isActive);
        
        if (currentThread) {
          state.currentThreadId = currentThread.id;
        }
        
        engine.importState(state);
        
        set({
          threads,
          currentThreadId: state.currentThreadId,
        });
      } catch (error) {
        console.error('❌ Error loading conversation threads:', error);
      }
    },
    
    // Refresh thread data
    refreshThreadData: async () => {
      const { currentThreadId, threads } = get();
      
      if (threads.length > 0 && threads[0]?.conversationId) {
        await get().loadConversationThreads(threads[0].conversationId);
      }
    },
  }))
);

// Subscribe to conversation changes to initialize threading
useThreadingStore.subscribe(
  (state) => state.threads,
  (threads) => {
    console.log('🧵 Threading state updated:', {
      threadCount: threads.length,
      currentThread: threads.find(t => t.id === useThreadingStore.getState().currentThreadId)?.name,
    });
  }
);