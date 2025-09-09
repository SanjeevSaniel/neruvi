/**
 * Threading and Tracing System Types
 * Provides conversation branching, message lineage, and thread management
 */

export interface ThreadNode {
  id: string;
  messageId: string;
  parentMessageId: string | null;
  children: string[]; // Child message IDs
  depth: number;
  branchName?: string;
  isMainThread: boolean;
  createdAt: Date;
}

export interface MessageTrace {
  messageId: string;
  conversationId: string;
  threadId: string;
  parentMessageId: string | null;
  childMessageIds: string[];
  branchPoint?: {
    originalMessageId: string;
    branchReason: string;
    branchTimestamp: Date;
  };
  lineage: string[]; // Array of message IDs from root to current
  depth: number;
  metadata: {
    regenerated?: boolean;
    editedFrom?: string;
    alternativeResponse?: boolean;
    userFeedback?: 'positive' | 'negative' | 'regenerate';
  };
}

export interface ConversationThread {
  id: string;
  conversationId: string;
  name: string;
  description?: string;
  rootMessageId: string;
  currentMessageId: string; // Current active message in this thread
  messageCount: number;
  isMainThread: boolean;
  isActive: boolean;
  branchedFrom?: {
    threadId: string;
    messageId: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadingState {
  currentThreadId: string;
  availableThreads: ConversationThread[];
  messageTraces: Map<string, MessageTrace>;
  threadNodes: Map<string, ThreadNode>;
}

export interface ThreadAction {
  type: 'CREATE_BRANCH' | 'SWITCH_THREAD' | 'MERGE_THREAD' | 'DELETE_THREAD' | 'REGENERATE_MESSAGE';
  payload: {
    messageId?: string;
    threadId?: string;
    branchName?: string;
    reason?: string;
  };
}

export interface ThreadVisualizationNode {
  id: string;
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  x: number;
  y: number;
  isActive: boolean;
  threadId: string;
  children: string[];
  parent: string | null;
}

export interface ThreadingConfig {
  maxThreadsPerConversation: number;
  maxDepthPerThread: number;
  autoArchiveInactiveThreads: boolean;
  visualizationEnabled: boolean;
  branchingEnabled: boolean;
}