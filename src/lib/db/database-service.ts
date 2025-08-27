import { getDatabase } from './connection';
import { users, conversations, messages, messageChunks, userUsage, User, Conversation, Message, NewUser, NewConversation, NewMessage } from './schema';
import { eq, desc, and, count, inArray } from 'drizzle-orm';
import { ContentStorageManager } from './content-storage';
import type { Message as ChatMessage, SourceTimestamp } from '@/components/chat/types';

export class DatabaseService {
  private db = getDatabase();
  private contentStorage = new ContentStorageManager();
  
  // ====== USER MANAGEMENT ======
  
  /**
   * Create or update user from Clerk data
   */
  async createOrUpdateUser(clerkId: string, email: string, displayName?: string): Promise<User> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          clerkId,
          email,
          displayName,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email,
            displayName,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      console.log(`👤 User created/updated: ${user.email}`);
      return user;
    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    }
  }
  
  /**
   * Get user by Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
      
      return user || null;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  }
  
  // ====== CONVERSATION MANAGEMENT ======
  
  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string, 
    title: string, 
    selectedCourse: 'nodejs' | 'python'
  ): Promise<Conversation> {
    try {
      const [conversation] = await this.db
        .insert(conversations)
        .values({
          userId,
          title,
          selectedCourse,
          messageCount: 0,
          totalTokens: 0,
        })
        .returning();
      
      console.log(`💬 Conversation created: "${title}" for course: ${selectedCourse}`);
      return conversation;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  }
  
  /**
   * Get user's conversations with pagination
   */
  async getUserConversations(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      course?: 'nodejs' | 'python';
    } = {}
  ): Promise<{
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 20, offset = 0, course } = options;
    
    try {
      let baseQuery = this.db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId));
      
      // Add course filter if specified
      if (course) {
        baseQuery = baseQuery.where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.selectedCourse, course)
          )
        );
      }
      
      // Get conversations with pagination
      const conversationsList = await baseQuery
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      let countQuery = this.db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.userId, userId));
      
      if (course) {
        countQuery = countQuery.where(
          and(
            eq(conversations.userId, userId),
            eq(conversations.selectedCourse, course)
          )
        );
      }
      
      const [{ count: total }] = await countQuery;
      
      return {
        conversations: conversationsList,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const [conversation] = await this.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, userId)
          )
        )
        .limit(1);
      
      return conversation || null;
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      return null;
    }
  }
  
  // ====== MESSAGE MANAGEMENT ======
  
  /**
   * Add a message to conversation with optimized storage
   */
  async addMessage(
    conversationId: string,
    message: ChatMessage,
    processingTimeMs?: number
  ): Promise<string> {
    try {
      console.log(`💾 Storing message: ${message.role} - ${message.content.length} characters`);
      
      // Store content using tiered strategy
      const contentResult = await this.contentStorage.storeContent(message.content);
      
      // Insert main message record
      const [savedMessage] = await this.db
        .insert(messages)
        .values({
          conversationId,
          role: message.role,
          content: contentResult.content || '',
          contentLarge: contentResult.contentLarge,
          contentCompressed: contentResult.contentCompressed,
          compressionType: contentResult.compressionType,
          characterCount: contentResult.characterCount,
          tokenCount: this.estimateTokenCount(message.content),
          sources: JSON.stringify(message.sources || []),
          processingTimeMs,
          contentType: 'text',
        })
        .returning();
      
      // Handle chunked content if needed
      if (contentResult.storageType === 'chunked') {
        await this.storeMessageChunks(savedMessage.id, message.content);
      }
      
      // Update conversation metadata
      await this.updateConversationMetadata(conversationId);
      
      console.log(`✅ Message stored with ID: ${savedMessage.id} (${contentResult.storageType} storage)`);
      return savedMessage.id;
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }
  }
  
  /**
   * Store message chunks for very large content
   */
  private async storeMessageChunks(messageId: string, content: string): Promise<void> {
    try {
      const chunks = this.contentStorage.createChunks(content);
      
      if (chunks.length > 0) {
        const chunkRecords = chunks.map(chunk => ({
          messageId,
          chunkOrder: chunk.chunkOrder,
          chunkContent: chunk.chunkContent,
          chunkSize: chunk.chunkSize,
        }));
        
        await this.db.insert(messageChunks).values(chunkRecords);
        console.log(`📦 Stored ${chunks.length} chunks for message ${messageId}`);
      }
    } catch (error) {
      console.error('❌ Error storing message chunks:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation messages with full content reconstruction
   */
  async getConversationMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ChatMessage[]> {
    const { limit = 50, offset = 0 } = options;
    
    try {
      // Get messages
      const messagesData = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt)
        .limit(limit)
        .offset(offset);
      
      if (messagesData.length === 0) {
        return [];
      }
      
      // Get chunks for chunked messages
      const chunkedMessageIds = messagesData
        .filter(m => m.content.startsWith('[CHUNKED_CONTENT:'))
        .map(m => m.id);
      
      const chunks = chunkedMessageIds.length > 0 
        ? await this.db
            .select()
            .from(messageChunks)
            .where(inArray(messageChunks.messageId, chunkedMessageIds))
        : [];
      
      // Reconstruct messages with full content
      const reconstructedMessages = await Promise.all(
        messagesData.map(async (msgData) => {
          const messageChunksForMsg = chunks.filter(c => c.messageId === msgData.id);
          const fullContent = await this.contentStorage.retrieveContent(
            {
              content: msgData.content,
              contentLarge: msgData.contentLarge,
              contentCompressed: msgData.contentCompressed,
              compressionType: msgData.compressionType,
              characterCount: msgData.characterCount,
            },
            messageChunksForMsg
          );
          
          let sources: SourceTimestamp[] = [];
          try {
            sources = msgData.sources && typeof msgData.sources === 'string' && msgData.sources.trim()
              ? JSON.parse(msgData.sources as string)
              : [];
          } catch (error) {
            console.warn('Failed to parse sources JSON:', msgData.sources, error);
            sources = [];
          }
          
          return {
            id: msgData.id,
            role: msgData.role as 'user' | 'assistant',
            content: fullContent,
            sources,
            timestamp: msgData.createdAt || new Date(),
          };
        })
      );
      
      console.log(`📖 Retrieved ${reconstructedMessages.length} messages for conversation ${conversationId}`);
      return reconstructedMessages;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
  }
  
  /**
   * Update conversation metadata (message count, tokens, etc.)
   */
  private async updateConversationMetadata(conversationId: string): Promise<void> {
    try {
      // Get message count and total characters/tokens for this conversation
      const stats = await this.db
        .select({
          messageCount: count(),
          // We can't easily aggregate custom fields, so we'll calculate in memory
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId));
      
      // Get sum of tokens (approximation)
      const tokenStats = await this.db
        .select({
          tokenCount: messages.tokenCount,
          characterCount: messages.characterCount,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId));
      
      const totalTokens = tokenStats.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);
      const messageCount = stats[0]?.messageCount || 0;
      
      await this.db
        .update(conversations)
        .set({
          messageCount,
          totalTokens,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));
      
      console.log(`📊 Updated conversation metadata: ${messageCount} messages, ${totalTokens} tokens`);
    } catch (error) {
      console.error('❌ Error updating conversation metadata:', error);
    }
  }
  
  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(content.length / 4);
  }
  
  // ====== USER USAGE TRACKING ======
  
  /**
   * Track user message usage for rate limiting
   */
  async trackUserUsage(userId: string): Promise<{ currentCount: number; limit: number }> {
    const RATE_LIMIT = 15;
    
    try {
      // Get or create user usage record
      let [usage] = await this.db
        .select()
        .from(userUsage)
        .where(eq(userUsage.userId, userId))
        .limit(1);
      
      if (!usage) {
        // Create new usage record
        [usage] = await this.db
          .insert(userUsage)
          .values({
            userId,
            messageCount: 1,
            lastResetAt: new Date(),
          })
          .returning();
      } else {
        // Check if we need to reset (daily reset)
        const now = new Date();
        const lastReset = new Date(usage.lastResetAt);
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceReset >= 24) {
          // Reset daily usage
          [usage] = await this.db
            .update(userUsage)
            .set({
              messageCount: 1,
              lastResetAt: now,
              updatedAt: now,
            })
            .where(eq(userUsage.userId, userId))
            .returning();
        } else {
          // Increment usage
          [usage] = await this.db
            .update(userUsage)
            .set({
              messageCount: usage.messageCount + 1,
              updatedAt: now,
            })
            .where(eq(userUsage.userId, userId))
            .returning();
        }
      }
      
      return {
        currentCount: usage.messageCount,
        limit: RATE_LIMIT
      };
    } catch (error) {
      console.error('❌ Error tracking user usage:', error);
      throw error;
    }
  }
  
  /**
   * Get user's current usage stats
   */
  async getUserUsage(userId: string): Promise<{ messageCount: number; limit: number; resetTime: Date } | null> {
    try {
      const [usage] = await this.db
        .select()
        .from(userUsage)
        .where(eq(userUsage.userId, userId))
        .limit(1);
      
      if (!usage) {
        return null;
      }
      
      // Calculate next reset time (24 hours from last reset)
      const resetTime = new Date(usage.lastResetAt);
      resetTime.setHours(resetTime.getHours() + 24);
      
      return {
        messageCount: usage.messageCount,
        limit: 15,
        resetTime
      };
    } catch (error) {
      console.error('❌ Error getting user usage:', error);
      return null;
    }
  }
  
  // ====== BULK OPERATIONS ======
  
  /**
   * Import data from SessionStorage (for migration)
   */
  async importFromSessionStorage(userId: string, sessionData: any): Promise<{ 
    conversationsImported: number; 
    messagesImported: number; 
  }> {
    try {
      let conversationsImported = 0;
      let messagesImported = 0;
      
      if (sessionData.conversations && Array.isArray(sessionData.conversations)) {
        for (const sessionConv of sessionData.conversations) {
          // Create conversation
          const dbConversation = await this.createConversation(
            userId,
            sessionConv.title || 'Imported Conversation',
            sessionConv.selectedCourse || 'nodejs'
          );
          
          conversationsImported++;
          
          // Import messages
          if (sessionConv.messages && Array.isArray(sessionConv.messages)) {
            for (const sessionMsg of sessionConv.messages) {
              await this.addMessage(dbConversation.id, {
                id: sessionMsg.id || Date.now().toString(),
                role: sessionMsg.role,
                content: sessionMsg.content || '',
                sources: sessionMsg.sources || [],
                timestamp: sessionMsg.timestamp ? new Date(sessionMsg.timestamp) : new Date(),
              });
              
              messagesImported++;
            }
          }
        }
      }
      
      console.log(`📦 Migration completed: ${conversationsImported} conversations, ${messagesImported} messages`);
      
      return {
        conversationsImported,
        messagesImported
      };
    } catch (error) {
      console.error('❌ Error importing from session storage:', error);
      throw error;
    }
  }
  
  /**
   * Delete conversation and all associated data
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      // Verify ownership and delete (cascading will handle messages and chunks)
      const result = await this.db
        .delete(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, userId)
          )
        );
      
      console.log(`🗑️ Conversation deleted: ${conversationId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      return false;
    }
  }
}