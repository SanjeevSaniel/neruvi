/**
 * Threading Engine - Core logic for conversation threading and tracing
 */

import { 
  ThreadNode, 
  MessageTrace, 
  ConversationThread, 
  ThreadingState, 
  ThreadAction,
  ThreadingConfig 
} from './types';

export class ThreadingEngine {
  private config: ThreadingConfig;
  private state: ThreadingState;

  constructor(config: Partial<ThreadingConfig> = {}) {
    this.config = {
      maxThreadsPerConversation: 10,
      maxDepthPerThread: 50,
      autoArchiveInactiveThreads: true,
      visualizationEnabled: true,
      branchingEnabled: true,
      ...config
    };

    this.state = {
      currentThreadId: '',
      availableThreads: [],
      messageTraces: new Map(),
      threadNodes: new Map(),
    };
  }

  /**
   * Initialize threading for a conversation
   */
  async initializeConversation(conversationId: string, firstMessageId?: string): Promise<string> {
    const mainThread: ConversationThread = {
      id: this.generateId(),
      conversationId,
      name: 'Main Thread',
      description: 'Primary conversation thread',
      rootMessageId: firstMessageId || '',
      currentMessageId: firstMessageId || '',
      messageCount: firstMessageId ? 1 : 0,
      isMainThread: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.availableThreads.push(mainThread);
    this.state.currentThreadId = mainThread.id;

    // Create initial trace if we have a first message
    if (firstMessageId) {
      await this.createMessageTrace(firstMessageId, mainThread.id, null);
    }

    return mainThread.id;
  }

  /**
   * Create a message trace for lineage tracking
   */
  async createMessageTrace(
    messageId: string, 
    threadId: string, 
    parentMessageId: string | null,
    metadata: Partial<MessageTrace['metadata']> = {}
  ): Promise<MessageTrace> {
    const parentTrace = parentMessageId ? this.state.messageTraces.get(parentMessageId) : null;
    const depth = parentTrace ? parentTrace.depth + 1 : 0;
    const lineage = parentTrace ? [...parentTrace.lineage, messageId] : [messageId];

    const trace: MessageTrace = {
      messageId,
      conversationId: this.getThreadById(threadId)?.conversationId || '',
      threadId,
      parentMessageId,
      childMessageIds: [],
      depth,
      lineage,
      metadata: {
        regenerated: false,
        editedFrom: undefined,
        alternativeResponse: false,
        userFeedback: undefined,
        ...metadata
      }
    };

    // Update parent's children
    if (parentTrace) {
      parentTrace.childMessageIds.push(messageId);
      this.state.messageTraces.set(parentMessageId!, parentTrace);
    }

    this.state.messageTraces.set(messageId, trace);

    // Create thread node
    const threadNode: ThreadNode = {
      id: this.generateId(),
      messageId,
      parentMessageId,
      children: [],
      depth,
      isMainThread: threadId === this.getMainThreadId(),
      createdAt: new Date(),
    };

    this.state.threadNodes.set(messageId, threadNode);

    return trace;
  }

  /**
   * Create a branch from a specific message
   */
  async createBranch(
    sourceMessageId: string, 
    branchName: string,
    branchReason: string = 'User requested branch'
  ): Promise<string> {
    if (!this.config.branchingEnabled) {
      throw new Error('Branching is disabled in configuration');
    }

    const sourceTrace = this.state.messageTraces.get(sourceMessageId);
    if (!sourceTrace) {
      throw new Error(`Message ${sourceMessageId} not found in traces`);
    }

    const sourceThread = this.getThreadById(sourceTrace.threadId);
    if (!sourceThread) {
      throw new Error(`Thread ${sourceTrace.threadId} not found`);
    }

    // Check thread limits
    if (this.state.availableThreads.length >= this.config.maxThreadsPerConversation) {
      throw new Error('Maximum number of threads reached');
    }

    const newThread: ConversationThread = {
      id: this.generateId(),
      conversationId: sourceThread.conversationId,
      name: branchName,
      description: `Branched from message at depth ${sourceTrace.depth}`,
      rootMessageId: sourceMessageId,
      currentMessageId: sourceMessageId,
      messageCount: 1,
      isMainThread: false,
      isActive: true,
      branchedFrom: {
        threadId: sourceTrace.threadId,
        messageId: sourceMessageId,
        timestamp: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.availableThreads.push(newThread);

    // Update source message trace to mark as branch point
    sourceTrace.branchPoint = {
      originalMessageId: sourceMessageId,
      branchReason,
      branchTimestamp: new Date(),
    };

    // Log the action
    await this.logThreadAction('CREATE_BRANCH', {
      messageId: sourceMessageId,
      threadId: newThread.id,
      branchName,
      reason: branchReason,
    });

    return newThread.id;
  }

  /**
   * Switch to a different thread
   */
  async switchThread(threadId: string): Promise<void> {
    const thread = this.getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    if (!thread.isActive) {
      throw new Error(`Thread ${threadId} is not active`);
    }

    this.state.currentThreadId = threadId;

    // Update thread's last accessed time
    thread.updatedAt = new Date();

    await this.logThreadAction('SWITCH_THREAD', {
      threadId,
    });
  }

  /**
   * Regenerate a message (creates alternative response)
   */
  async regenerateMessage(messageId: string, reason: string = 'User requested regeneration'): Promise<string> {
    const trace = this.state.messageTraces.get(messageId);
    if (!trace) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Create new thread for alternative response if needed
    let targetThreadId = trace.threadId;
    
    // Check if this creates too many alternatives
    const existingAlternatives = Array.from(this.state.messageTraces.values())
      .filter(t => t.metadata.alternativeResponse && t.parentMessageId === trace.parentMessageId);

    if (existingAlternatives.length >= 3) { // Limit alternatives
      throw new Error('Too many alternative responses for this message');
    }

    const newMessageId = this.generateId();

    // Create trace for regenerated message
    await this.createMessageTrace(newMessageId, targetThreadId, trace.parentMessageId, {
      regenerated: true,
      alternativeResponse: true,
    });

    await this.logThreadAction('REGENERATE_MESSAGE', {
      messageId,
      reason,
    });

    return newMessageId;
  }

  /**
   * Get conversation threads with their current state
   */
  getConversationThreads(conversationId: string): ConversationThread[] {
    return this.state.availableThreads
      .filter(thread => thread.conversationId === conversationId)
      .sort((a, b) => {
        // Main thread first, then by update time
        if (a.isMainThread) return -1;
        if (b.isMainThread) return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }

  /**
   * Get message lineage for a specific message
   */
  getMessageLineage(messageId: string): MessageTrace[] {
    const trace = this.state.messageTraces.get(messageId);
    if (!trace) return [];

    return trace.lineage
      .map(id => this.state.messageTraces.get(id))
      .filter((t): t is MessageTrace => t !== undefined);
  }

  /**
   * Get thread statistics
   */
  getThreadStatistics(threadId: string) {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;

    const threadTraces = Array.from(this.state.messageTraces.values())
      .filter(trace => trace.threadId === threadId);

    return {
      threadId,
      messageCount: threadTraces.length,
      maxDepth: Math.max(...threadTraces.map(t => t.depth), 0),
      branchPoints: threadTraces.filter(t => t.branchPoint).length,
      alternatives: threadTraces.filter(t => t.metadata.alternativeResponse).length,
      regenerations: threadTraces.filter(t => t.metadata.regenerated).length,
      userFeedback: {
        positive: threadTraces.filter(t => t.metadata.userFeedback === 'positive').length,
        negative: threadTraces.filter(t => t.metadata.userFeedback === 'negative').length,
      }
    };
  }

  // Helper methods
  private getThreadById(threadId: string): ConversationThread | undefined {
    return this.state.availableThreads.find(thread => thread.id === threadId);
  }

  private getMainThreadId(): string {
    return this.state.availableThreads.find(thread => thread.isMainThread)?.id || '';
  }

  private generateId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logThreadAction(actionType: ThreadAction['type'], payload: ThreadAction['payload']): Promise<void> {
    // Implementation would log to database
    console.log(`🧵 Thread Action: ${actionType}`, payload);
  }

  // Export current state
  exportState(): ThreadingState {
    return { ...this.state };
  }

  // Import state
  importState(state: ThreadingState): void {
    this.state = state;
  }
}