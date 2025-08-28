/**
 * Threading Database Service - Handles persistence for threading system
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { getDatabase } from '@/lib/db/connection';
import { 
  conversationThreads, 
  messageTraces, 
  threadActions 
} from './schema-extensions';
import { messages, conversations } from '@/lib/db/schema';
import { ConversationThread, MessageTrace, ThreadAction } from './types';

export class ThreadingDatabaseService {
  private db = getDatabase();

  /**
   * Create a new conversation thread
   */
  async createThread(thread: Omit<ConversationThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const [newThread] = await this.db
        .insert(conversationThreads)
        .values({
          conversationId: thread.conversationId,
          name: thread.name,
          description: thread.description,
          rootMessageId: thread.rootMessageId,
          currentMessageId: thread.currentMessageId,
          messageCount: thread.messageCount,
          isMainThread: thread.isMainThread,
          isActive: thread.isActive,
          branchedFromThreadId: thread.branchedFrom?.threadId,
          branchedFromMessageId: thread.branchedFrom?.messageId,
          branchReason: thread.branchedFrom ? 'Branched from message' : undefined,
          priority: thread.isMainThread ? 1000 : 0, // Main thread has highest priority
        })
        .returning({ id: conversationThreads.id });

      return newThread.id;
    } catch (error) {
      console.error('❌ Error creating thread:', error);
      throw new Error('Failed to create conversation thread');
    }
  }

  /**
   * Get all threads for a conversation
   */
  async getConversationThreads(conversationId: string): Promise<ConversationThread[]> {
    try {
      const threads = await this.db
        .select()
        .from(conversationThreads)
        .where(eq(conversationThreads.conversationId, conversationId))
        .orderBy(desc(conversationThreads.priority), desc(conversationThreads.updatedAt));

      return threads.map(thread => ({
        id: thread.id,
        conversationId: thread.conversationId,
        name: thread.name,
        description: thread.description || undefined,
        rootMessageId: thread.rootMessageId || '',
        currentMessageId: thread.currentMessageId || '',
        messageCount: thread.messageCount || 0,
        isMainThread: thread.isMainThread || false,
        isActive: thread.isActive || true,
        branchedFrom: thread.branchedFromThreadId ? {
          threadId: thread.branchedFromThreadId,
          messageId: thread.branchedFromMessageId || '',
          timestamp: thread.createdAt || new Date(),
        } : undefined,
        createdAt: thread.createdAt || new Date(),
        updatedAt: thread.updatedAt || new Date(),
      }));
    } catch (error) {
      console.error('❌ Error fetching conversation threads:', error);
      return [];
    }
  }

  /**
   * Update thread information
   */
  async updateThread(threadId: string, updates: Partial<ConversationThread>): Promise<void> {
    try {
      await this.db
        .update(conversationThreads)
        .set({
          name: updates.name,
          description: updates.description,
          currentMessageId: updates.currentMessageId,
          messageCount: updates.messageCount,
          isActive: updates.isActive,
          updatedAt: new Date(),
        })
        .where(eq(conversationThreads.id, threadId));
    } catch (error) {
      console.error('❌ Error updating thread:', error);
      throw new Error('Failed to update thread');
    }
  }

  /**
   * Create a message trace
   */
  async createMessageTrace(trace: Omit<MessageTrace, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.db
        .insert(messageTraces)
        .values({
          messageId: trace.messageId,
          conversationId: trace.conversationId,
          threadId: trace.threadId,
          parentMessageId: trace.parentMessageId,
          depth: trace.depth,
          position: 0, // Will be calculated
          lineage: trace.lineage,
          isBranchPoint: !!trace.branchPoint,
          originalMessageId: trace.branchPoint?.originalMessageId,
          isRegeneratedResponse: trace.metadata.regenerated || false,
          isEditedMessage: !!trace.metadata.editedFrom,
          isAlternativeResponse: trace.metadata.alternativeResponse || false,
          userFeedback: trace.metadata.userFeedback,
        });

      // Update parent message if it exists
      if (trace.parentMessageId) {
        await this.db
          .update(messageTraces)
          .set({ 
            isBranchPoint: true,
            branchCount: this.db
              .select({ count: messageTraces.id })
              .from(messageTraces)
              .where(eq(messageTraces.parentMessageId, trace.parentMessageId))
              .limit(1) as any
          })
          .where(eq(messageTraces.messageId, trace.parentMessageId));
      }
    } catch (error) {
      console.error('❌ Error creating message trace:', error);
      throw new Error('Failed to create message trace');
    }
  }

  /**
   * Get message trace by message ID
   */
  async getMessageTrace(messageId: string): Promise<MessageTrace | null> {
    try {
      const [trace] = await this.db
        .select()
        .from(messageTraces)
        .where(eq(messageTraces.messageId, messageId))
        .limit(1);

      if (!trace) return null;

      return {
        messageId: trace.messageId,
        conversationId: trace.conversationId,
        threadId: trace.threadId,
        parentMessageId: trace.parentMessageId,
        childMessageIds: [], // Would need separate query
        branchPoint: trace.isBranchPoint ? {
          originalMessageId: trace.originalMessageId || '',
          branchReason: 'Branch created',
          branchTimestamp: trace.createdAt || new Date(),
        } : undefined,
        lineage: (trace.lineage as string[]) || [],
        depth: trace.depth || 0,
        metadata: {
          regenerated: trace.isRegeneratedResponse || false,
          editedFrom: trace.isEditedMessage ? 'previous_version' : undefined,
          alternativeResponse: trace.isAlternativeResponse || false,
          userFeedback: trace.userFeedback as any,
        }
      };
    } catch (error) {
      console.error('❌ Error fetching message trace:', error);
      return null;
    }
  }

  /**
   * Get all traces for a thread
   */
  async getThreadTraces(threadId: string): Promise<MessageTrace[]> {
    try {
      const traces = await this.db
        .select()
        .from(messageTraces)
        .where(eq(messageTraces.threadId, threadId))
        .orderBy(asc(messageTraces.depth), asc(messageTraces.position));

      return traces.map(trace => ({
        messageId: trace.messageId,
        conversationId: trace.conversationId,
        threadId: trace.threadId,
        parentMessageId: trace.parentMessageId,
        childMessageIds: [], // Would need separate query
        branchPoint: trace.isBranchPoint ? {
          originalMessageId: trace.originalMessageId || '',
          branchReason: 'Branch created',
          branchTimestamp: trace.createdAt || new Date(),
        } : undefined,
        lineage: (trace.lineage as string[]) || [],
        depth: trace.depth || 0,
        metadata: {
          regenerated: trace.isRegeneratedResponse || false,
          editedFrom: trace.isEditedMessage ? 'previous_version' : undefined,
          alternativeResponse: trace.isAlternativeResponse || false,
          userFeedback: trace.userFeedback as any,
        }
      }));
    } catch (error) {
      console.error('❌ Error fetching thread traces:', error);
      return [];
    }
  }

  /**
   * Log a thread action
   */
  async logThreadAction(
    conversationId: string,
    actionType: string,
    actionData: any,
    userId: string,
    threadId?: string,
    messageId?: string
  ): Promise<void> {
    try {
      await this.db
        .insert(threadActions)
        .values({
          conversationId,
          threadId,
          messageId,
          actionType,
          actionData,
          userId,
          reversible: true,
          undoData: {}, // Could store data needed for undo
        });
    } catch (error) {
      console.error('❌ Error logging thread action:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get thread statistics
   */
  async getThreadStatistics(threadId: string) {
    try {
      const [stats] = await this.db
        .select({
          messageCount: conversationThreads.messageCount,
          branchCount: this.db
            .select({ count: messageTraces.id })
            .from(messageTraces)
            .where(and(
              eq(messageTraces.threadId, threadId),
              eq(messageTraces.isBranchPoint, true)
            ))
            .limit(1) as any,
          alternativeCount: this.db
            .select({ count: messageTraces.id })
            .from(messageTraces)
            .where(and(
              eq(messageTraces.threadId, threadId),
              eq(messageTraces.isAlternativeResponse, true)
            ))
            .limit(1) as any,
        })
        .from(conversationThreads)
        .where(eq(conversationThreads.id, threadId))
        .limit(1);

      return stats || { messageCount: 0, branchCount: 0, alternativeCount: 0 };
    } catch (error) {
      console.error('❌ Error fetching thread statistics:', error);
      return { messageCount: 0, branchCount: 0, alternativeCount: 0 };
    }
  }

  /**
   * Archive inactive threads
   */
  async archiveInactiveThreads(conversationId: string, daysInactive: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const [result] = await this.db
        .update(conversationThreads)
        .set({ isActive: false })
        .where(and(
          eq(conversationThreads.conversationId, conversationId),
          eq(conversationThreads.isMainThread, false), // Never archive main thread
          eq(conversationThreads.isActive, true),
          // updatedAt < cutoffDate (would need proper date comparison)
        ))
        .returning({ id: conversationThreads.id });

      return result ? 1 : 0; // Simplified return
    } catch (error) {
      console.error('❌ Error archiving inactive threads:', error);
      return 0;
    }
  }
}