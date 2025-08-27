# 🗃️ NeonDB Implementation Guide: Long Response Storage

## 🎯 **Overview: Storing Long Assistant Responses**

This guide provides a step-by-step implementation for integrating NeonDB to store long assistant responses, replacing SessionStorage with persistent database storage while maintaining backward compatibility.

---

## 📊 **Database Schema Design**

### **Core Tables for Long Response Storage**:

```sql
-- Users table (synced with Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_users_clerk_id (clerk_id),
    INDEX idx_users_email (email)
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    selected_course VARCHAR(50) CHECK (selected_course IN ('nodejs', 'python')),
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for efficient querying
    INDEX idx_conversations_user_id (user_id),
    INDEX idx_conversations_created_at (created_at DESC),
    INDEX idx_conversations_user_course (user_id, selected_course)
);

-- Messages table - optimized for long content storage
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    
    -- Content storage strategies
    content TEXT NOT NULL, -- For shorter messages (< 8KB)
    content_large TEXT,    -- For longer messages (8KB - 1MB)
    content_compressed BYTEA, -- For compressed large content (> 1MB)
    content_external_url VARCHAR(500), -- For extremely large content stored externally
    
    -- Message metadata
    token_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'markdown', 'code'
    compression_type VARCHAR(20), -- 'gzip', 'brotli', null
    
    -- Sources for assistant messages (JSONB for flexibility)
    sources JSONB DEFAULT '[]',
    
    -- Message timing and status
    created_at TIMESTAMP DEFAULT NOW(),
    processing_time_ms INTEGER, -- How long the response took to generate
    
    -- Indexes for performance
    INDEX idx_messages_conversation_id (conversation_id),
    INDEX idx_messages_created_at (created_at),
    INDEX idx_messages_role (role),
    INDEX idx_messages_content_size (character_count)
);

-- Message chunks table for very large responses (alternative approach)
CREATE TABLE message_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_order INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    chunk_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure proper ordering
    UNIQUE(message_id, chunk_order),
    INDEX idx_message_chunks_message_id (message_id, chunk_order)
);

-- Usage tracking for rate limiting
CREATE TABLE user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one record per user
    UNIQUE(user_id)
);
```

---

## 🔧 **Implementation Setup**

### **Step 1: Install Dependencies**

```bash
# Database and ORM
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# Compression for large content
npm install zlib

# Environment configuration
npm install dotenv
```

### **Step 2: Environment Configuration**

```bash
# .env.local
# NeonDB Connection
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
DIRECT_URL="postgresql://username:password@hostname/database?sslmode=require"

# Feature Flags
NEXT_PUBLIC_USE_DATABASE="false" # Start with false for safety
NEXT_PUBLIC_ENABLE_COMPRESSION="true"
NEXT_PUBLIC_MAX_MESSAGE_SIZE="1048576" # 1MB

# Clerk Integration
CLERK_WEBHOOK_SECRET="your_webhook_secret"
```

---

## 🏗️ **Database Schema Implementation**

### **Drizzle Schema Definition**:

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, bytea, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkIdIdx: index('idx_users_clerk_id').on(table.clerkId),
  emailIdx: index('idx_users_email').on(table.email),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  selectedCourse: varchar('selected_course', { length: 50 }),
  messageCount: integer('message_count').default(0),
  totalTokens: integer('total_tokens').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_conversations_user_id').on(table.userId),
  createdAtIdx: index('idx_conversations_created_at').on(table.createdAt),
  userCourseIdx: index('idx_conversations_user_course').on(table.userId, table.selectedCourse),
}));

// Messages table - optimized for long content
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  
  // Multi-tier content storage
  content: text('content').notNull(),
  contentLarge: text('content_large'),
  contentCompressed: bytea('content_compressed'),
  contentExternalUrl: varchar('content_external_url', { length: 500 }),
  
  // Metadata
  tokenCount: integer('token_count').default(0),
  characterCount: integer('character_count').default(0),
  contentType: varchar('content_type', { length: 20 }).default('text'),
  compressionType: varchar('compression_type', { length: 20 }),
  
  // Assistant message sources
  sources: jsonb('sources').default('[]'),
  
  // Timing
  createdAt: timestamp('created_at').defaultNow(),
  processingTimeMs: integer('processing_time_ms'),
}, (table) => ({
  conversationIdIdx: index('idx_messages_conversation_id').on(table.conversationId),
  createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
  roleIdx: index('idx_messages_role').on(table.role),
  contentSizeIdx: index('idx_messages_content_size').on(table.characterCount),
}));

// Message chunks for extremely large content
export const messageChunks = pgTable('message_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  chunkOrder: integer('chunk_order').notNull(),
  chunkContent: text('chunk_content').notNull(),
  chunkSize: integer('chunk_size').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  messageIdOrderIdx: index('idx_message_chunks_message_id').on(table.messageId, table.chunkOrder),
}));

// Usage tracking
export const userUsage = pgTable('user_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').default(0),
  lastResetAt: timestamp('last_reset_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  usage: many(userUsage),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  chunks: many(messageChunks),
}));
```

---

## 💾 **Content Storage Strategy for Long Responses**

### **Tiered Storage Approach**:

```typescript
// src/lib/db/content-storage.ts
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface ContentStorageResult {
  content?: string;
  contentLarge?: string;
  contentCompressed?: Buffer;
  contentExternalUrl?: string;
  compressionType?: string;
  characterCount: number;
  storageType: 'standard' | 'large' | 'compressed' | 'external' | 'chunked';
}

export class ContentStorageManager {
  private readonly SMALL_CONTENT_LIMIT = 8 * 1024; // 8KB
  private readonly LARGE_CONTENT_LIMIT = 1024 * 1024; // 1MB
  private readonly CHUNK_SIZE = 32 * 1024; // 32KB per chunk
  
  async storeContent(content: string): Promise<ContentStorageResult> {
    const characterCount = content.length;
    const byteSize = Buffer.byteLength(content, 'utf8');
    
    // Strategy 1: Small content - store directly
    if (byteSize <= this.SMALL_CONTENT_LIMIT) {
      return {
        content,
        characterCount,
        storageType: 'standard'
      };
    }
    
    // Strategy 2: Medium content - store in large text field
    if (byteSize <= this.LARGE_CONTENT_LIMIT) {
      return {
        contentLarge: content,
        characterCount,
        storageType: 'large'
      };
    }
    
    // Strategy 3: Large content - compress and store
    try {
      const compressed = await gzipAsync(Buffer.from(content, 'utf8'));
      
      // If compression saves significant space, use it
      if (compressed.length < byteSize * 0.7) {
        return {
          contentCompressed: compressed,
          compressionType: 'gzip',
          characterCount,
          storageType: 'compressed'
        };
      }
    } catch (error) {
      console.warn('Compression failed:', error);
    }
    
    // Strategy 4: Very large content - chunk it
    return await this.createChunkedStorage(content, characterCount);
  }
  
  private async createChunkedStorage(
    content: string, 
    characterCount: number
  ): Promise<ContentStorageResult> {
    // This will be handled separately in message creation
    return {
      content: `[CHUNKED_CONTENT:${characterCount}]`, // Placeholder
      characterCount,
      storageType: 'chunked'
    };
  }
  
  async retrieveContent(
    messageData: any,
    messageChunks?: any[]
  ): Promise<string> {
    // Standard content
    if (messageData.content && !messageData.content.startsWith('[CHUNKED_CONTENT:')) {
      return messageData.content;
    }
    
    // Large content
    if (messageData.contentLarge) {
      return messageData.contentLarge;
    }
    
    // Compressed content
    if (messageData.contentCompressed) {
      try {
        const decompressed = await gunzipAsync(messageData.contentCompressed);
        return decompressed.toString('utf8');
      } catch (error) {
        console.error('Decompression failed:', error);
        return '[Content decompression failed]';
      }
    }
    
    // Chunked content
    if (messageChunks && messageChunks.length > 0) {
      return messageChunks
        .sort((a, b) => a.chunkOrder - b.chunkOrder)
        .map(chunk => chunk.chunkContent)
        .join('');
    }
    
    return '[Content not found]';
  }
}
```

---

## 🔌 **Database Connection Setup**

```typescript
// src/lib/db/connection.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  
  return db;
}

// Connection health check
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
```

---

## 🔄 **Database Service Implementation**

```typescript
// src/lib/db/database-service.ts
import { getDatabase } from './connection';
import { users, conversations, messages, messageChunks, userUsage } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { ContentStorageManager } from './content-storage';
import type { Message } from '@/components/chat/types';

export class DatabaseService {
  private db = getDatabase();
  private contentStorage = new ContentStorageManager();
  
  // User management
  async createOrUpdateUser(clerkId: string, email: string, displayName?: string) {
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
      
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }
  
  // Conversation management
  async createConversation(
    userId: string, 
    title: string, 
    selectedCourse: 'nodejs' | 'python'
  ) {
    try {
      const [conversation] = await this.db
        .insert(conversations)
        .values({
          userId,
          title,
          selectedCourse,
        })
        .returning();
      
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
  
  async getUserConversations(userId: string) {
    try {
      return await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }
  
  // Message management - optimized for long content
  async addMessage(
    conversationId: string,
    message: Message,
    processingTimeMs?: number
  ) {
    try {
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
        })
        .returning();
      
      // Handle chunked content if needed
      if (contentResult.storageType === 'chunked') {
        await this.storeMessageChunks(savedMessage.id, message.content);
      }
      
      // Update conversation metadata
      await this.updateConversationMetadata(conversationId);
      
      return savedMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }
  
  private async storeMessageChunks(messageId: string, content: string) {
    const CHUNK_SIZE = 32 * 1024; // 32KB
    const chunks = [];
    
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      const chunkContent = content.slice(i, i + CHUNK_SIZE);
      chunks.push({
        messageId,
        chunkOrder: Math.floor(i / CHUNK_SIZE),
        chunkContent,
        chunkSize: chunkContent.length,
      });
    }
    
    if (chunks.length > 0) {
      await this.db.insert(messageChunks).values(chunks);
    }
  }
  
  async getConversationMessages(conversationId: string) {
    try {
      // Get messages with potential chunks
      const messagesData = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      
      // Retrieve chunks for chunked messages
      const messageIds = messagesData
        .filter(m => m.content.startsWith('[CHUNKED_CONTENT:'))
        .map(m => m.id);
      
      const chunks = messageIds.length > 0 
        ? await this.db
            .select()
            .from(messageChunks)
            .where(messageChunks.messageId.in(messageIds))
        : [];
      
      // Reconstruct messages with full content
      const reconstructedMessages = await Promise.all(
        messagesData.map(async (msgData) => {
          const messageChunksForMsg = chunks.filter(c => c.messageId === msgData.id);
          const fullContent = await this.contentStorage.retrieveContent(msgData, messageChunksForMsg);
          
          return {
            id: msgData.id,
            role: msgData.role,
            content: fullContent,
            sources: JSON.parse(msgData.sources || '[]'),
            timestamp: msgData.createdAt,
            processingTimeMs: msgData.processingTimeMs,
          };
        })
      );
      
      return reconstructedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
  
  private async updateConversationMetadata(conversationId: string) {
    try {
      // Get message count and total characters
      const stats = await this.db
        .select({
          count: messages.id,
          totalChars: messages.characterCount,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId));
      
      const messageCount = stats.length;
      const totalTokens = stats.reduce((sum, stat) => sum + (stat.totalChars || 0), 0) / 4; // Rough token estimate
      
      await this.db
        .update(conversations)
        .set({
          messageCount,
          totalTokens,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Error updating conversation metadata:', error);
    }
  }
  
  private estimateTokenCount(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }
  
  // Bulk import from SessionStorage
  async importFromSessionStorage(sessionData: any) {
    try {
      // This will be implemented for migration
      console.log('Importing from session storage...');
      // Implementation details for migration
    } catch (error) {
      console.error('Error importing from session storage:', error);
      throw error;
    }
  }
}
```

---

## 📚 **Comprehensive Chat History Management**

### **Chat History Features**:

```typescript
// src/lib/db/chat-history-manager.ts
import { DatabaseService } from './database-service';
import { getDatabase } from './connection';
import { conversations, messages, users } from './schema';
import { eq, desc, asc, and, or, like, count, sql } from 'drizzle-orm';

export class ChatHistoryManager {
  private db = getDatabase();
  private dbService = new DatabaseService();
  
  // ====== CONVERSATION HISTORY ======
  
  async getUserChatHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      course?: 'nodejs' | 'python';
      searchQuery?: string;
      sortBy?: 'created_at' | 'updated_at' | 'message_count';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      course,
      searchQuery,
      sortBy = 'updated_at',
      sortOrder = 'desc'
    } = options;
    
    try {
      let query = this.db
        .select({
          id: conversations.id,
          title: conversations.title,
          selectedCourse: conversations.selectedCourse,
          messageCount: conversations.messageCount,
          totalTokens: conversations.totalTokens,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          // Get latest message preview
          latestMessagePreview: sql<string>`
            (SELECT LEFT(content, 100) FROM messages 
             WHERE conversation_id = ${conversations.id} 
             ORDER BY created_at DESC LIMIT 1)
          `,
          latestMessageAt: sql<Date>`
            (SELECT created_at FROM messages 
             WHERE conversation_id = ${conversations.id} 
             ORDER BY created_at DESC LIMIT 1)
          `
        })
        .from(conversations)
        .where(eq(conversations.userId, userId));
      
      // Apply filters
      if (course) {
        query = query.where(and(
          eq(conversations.userId, userId),
          eq(conversations.selectedCourse, course)
        ));
      }
      
      if (searchQuery) {
        query = query.where(and(
          eq(conversations.userId, userId),
          or(
            like(conversations.title, `%${searchQuery}%`),
            // Search in message content
            sql`EXISTS (
              SELECT 1 FROM messages m 
              WHERE m.conversation_id = ${conversations.id} 
              AND (m.content ILIKE ${'%' + searchQuery + '%'} 
                   OR m.content_large ILIKE ${'%' + searchQuery + '%'})
            )`
          )
        ));
      }
      
      // Apply sorting
      const orderColumn = sortBy === 'created_at' ? conversations.createdAt 
                        : sortBy === 'updated_at' ? conversations.updatedAt
                        : conversations.messageCount;
                        
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(orderColumn))
        : query.orderBy(asc(orderColumn));
      
      // Apply pagination
      const results = await query.limit(limit).offset(offset);
      
      // Get total count for pagination
      const totalQuery = this.db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.userId, userId));
        
      if (course) {
        totalQuery.where(and(
          eq(conversations.userId, userId),
          eq(conversations.selectedCourse, course)
        ));
      }
      
      const [{ count: totalCount }] = await totalQuery;
      
      return {
        conversations: results,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }
  
  // ====== MESSAGE HISTORY ======
  
  async getConversationHistory(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      includeMetadata?: boolean;
      messageTypes?: ('user' | 'assistant')[];
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      includeMetadata = false,
      messageTypes = ['user', 'assistant']
    } = options;
    
    try {
      let query = this.db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          messages.role.in(messageTypes)
        ))
        .orderBy(asc(messages.createdAt))
        .limit(limit)
        .offset(offset);
      
      const messagesData = await query;
      
      // Get chunks for chunked messages
      const chunkedMessageIds = messagesData
        .filter(m => m.content.startsWith('[CHUNKED_CONTENT:'))
        .map(m => m.id);
      
      const chunks = chunkedMessageIds.length > 0 
        ? await this.db
            .select()
            .from(messageChunks)
            .where(messageChunks.messageId.in(chunkedMessageIds))
        : [];
      
      // Reconstruct full messages
      const contentStorage = new ContentStorageManager();
      const fullMessages = await Promise.all(
        messagesData.map(async (msgData) => {
          const messageChunksForMsg = chunks.filter(c => c.messageId === msgData.id);
          const fullContent = await contentStorage.retrieveContent(msgData, messageChunksForMsg);
          
          const message = {
            id: msgData.id,
            role: msgData.role,
            content: fullContent,
            sources: JSON.parse(msgData.sources || '[]'),
            timestamp: msgData.createdAt,
          };
          
          // Add metadata if requested
          if (includeMetadata) {
            return {
              ...message,
              metadata: {
                tokenCount: msgData.tokenCount,
                characterCount: msgData.characterCount,
                contentType: msgData.contentType,
                compressionType: msgData.compressionType,
                processingTimeMs: msgData.processingTimeMs,
              }
            };
          }
          
          return message;
        })
      );
      
      return {
        messages: fullMessages,
        pagination: {
          limit,
          offset,
          hasMore: fullMessages.length === limit
        }
      };
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }
  
  // ====== SEARCH & FILTERING ======
  
  async searchChatHistory(
    userId: string,
    searchQuery: string,
    options: {
      course?: 'nodejs' | 'python';
      dateRange?: { from: Date; to: Date };
      messageType?: 'user' | 'assistant';
      limit?: number;
    } = {}
  ) {
    const { course, dateRange, messageType, limit = 20 } = options;
    
    try {
      let query = this.db
        .select({
          conversationId: messages.conversationId,
          conversationTitle: conversations.title,
          messageId: messages.id,
          messageRole: messages.role,
          messageContent: sql<string>`
            CASE 
              WHEN LENGTH(${messages.content}) > 200 
              THEN LEFT(${messages.content}, 200) || '...'
              ELSE ${messages.content}
            END
          `,
          messageDate: messages.createdAt,
          course: conversations.selectedCourse,
          // Relevance ranking for search results
          relevance: sql<number>`
            ts_rank(
              to_tsvector('english', ${messages.content}), 
              plainto_tsquery('english', ${searchQuery})
            )
          `
        })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(and(
          eq(conversations.userId, userId),
          or(
            sql`${messages.content} ILIKE ${'%' + searchQuery + '%'}`,
            sql`${messages.contentLarge} ILIKE ${'%' + searchQuery + '%'}`,
            sql`to_tsvector('english', ${messages.content}) @@ plainto_tsquery('english', ${searchQuery})`
          )
        ));
      
      // Apply additional filters
      if (course) {
        query = query.where(and(
          eq(conversations.userId, userId),
          eq(conversations.selectedCourse, course)
        ));
      }
      
      if (messageType) {
        query = query.where(and(
          eq(conversations.userId, userId),
          eq(messages.role, messageType)
        ));
      }
      
      if (dateRange) {
        query = query.where(and(
          eq(conversations.userId, userId),
          sql`${messages.createdAt} >= ${dateRange.from}`,
          sql`${messages.createdAt} <= ${dateRange.to}`
        ));
      }
      
      const results = await query
        .orderBy(desc(sql`relevance`), desc(messages.createdAt))
        .limit(limit);
      
      return results;
    } catch (error) {
      console.error('Error searching chat history:', error);
      throw error;
    }
  }
  
  // ====== ANALYTICS & INSIGHTS ======
  
  async getChatAnalytics(userId: string, timeframe: '7d' | '30d' | '90d' | 'all' = '30d') {
    try {
      const timeframeDate = timeframe === 'all' ? new Date('2020-01-01') 
        : new Date(Date.now() - (parseInt(timeframe) * 24 * 60 * 60 * 1000));
      
      const analytics = await this.db
        .select({
          totalConversations: count(conversations.id),
          totalMessages: sql<number>`COUNT(${messages.id})`,
          totalTokens: sql<number>`SUM(${conversations.totalTokens})`,
          avgMessagesPerConversation: sql<number>`AVG(${conversations.messageCount})`,
          coursesUsed: sql<string[]>`ARRAY_AGG(DISTINCT ${conversations.selectedCourse})`,
          // Daily activity
          dailyActivity: sql<any>`
            json_agg(
              json_build_object(
                'date', DATE(${messages.createdAt}),
                'message_count', COUNT(${messages.id})
              )
            )
          `,
        })
        .from(conversations)
        .leftJoin(messages, eq(messages.conversationId, conversations.id))
        .where(and(
          eq(conversations.userId, userId),
          sql`${conversations.createdAt} >= ${timeframeDate}`
        ));
      
      return analytics[0];
    } catch (error) {
      console.error('Error fetching chat analytics:', error);
      throw error;
    }
  }
  
  // ====== CONVERSATION MANAGEMENT ======
  
  async archiveConversation(conversationId: string, userId: string) {
    try {
      // Add archived flag to conversations table (need to add this column)
      await this.db
        .update(conversations)
        .set({ 
          // archived: true, // Add this column to schema
          updatedAt: new Date() 
        })
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ));
      
      return { success: true };
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }
  
  async deleteConversation(conversationId: string, userId: string) {
    try {
      // Cascading delete will handle messages and chunks
      await this.db
        .delete(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
  
  async updateConversationTitle(
    conversationId: string, 
    userId: string, 
    newTitle: string
  ) {
    try {
      await this.db
        .update(conversations)
        .set({ 
          title: newTitle,
          updatedAt: new Date() 
        })
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  }
  
  // ====== EXPORT & BACKUP ======
  
  async exportConversation(conversationId: string, userId: string, format: 'json' | 'markdown' | 'txt' = 'json') {
    try {
      const conversationData = await this.db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ))
        .limit(1);
      
      if (conversationData.length === 0) {
        throw new Error('Conversation not found');
      }
      
      const conversation = conversationData[0];
      const messagesData = await this.getConversationHistory(conversationId, { 
        limit: 1000, 
        includeMetadata: true 
      });
      
      switch (format) {
        case 'json':
          return {
            conversation,
            messages: messagesData.messages,
            exportedAt: new Date(),
            format: 'json'
          };
          
        case 'markdown':
          return this.formatAsMarkdown(conversation, messagesData.messages);
          
        case 'txt':
          return this.formatAsText(conversation, messagesData.messages);
          
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      throw error;
    }
  }
  
  private formatAsMarkdown(conversation: any, messages: any[]): string {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Course:** ${conversation.selectedCourse}\n`;
    markdown += `**Created:** ${conversation.createdAt}\n`;
    markdown += `**Messages:** ${conversation.messageCount}\n\n`;
    markdown += `---\n\n`;
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      markdown += `## ${role} - ${message.timestamp}\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (message.sources && message.sources.length > 0) {
        markdown += `**Sources:**\n`;
        message.sources.forEach((source: any) => {
          markdown += `- ${source.course} - ${source.section} (${source.timestamp})\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
    
    return markdown;
  }
  
  private formatAsText(conversation: any, messages: any[]): string {
    let text = `${conversation.title}\n`;
    text += `Course: ${conversation.selectedCourse}\n`;
    text += `Created: ${conversation.createdAt}\n`;
    text += `Messages: ${conversation.messageCount}\n\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
      text += `[${role}] ${message.timestamp}\n`;
      text += `${message.content}\n\n`;
      text += `${'-'.repeat(30)}\n\n`;
    });
    
    return text;
  }
  
  // ====== CLEANUP & MAINTENANCE ======
  
  async cleanupOldConversations(userId: string, olderThanDays: number = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
      
      const deletedConversations = await this.db
        .delete(conversations)
        .where(and(
          eq(conversations.userId, userId),
          sql`${conversations.updatedAt} < ${cutoffDate}`
        ))
        .returning({ id: conversations.id });
      
      return {
        deletedCount: deletedConversations.length,
        deletedIds: deletedConversations.map(c => c.id)
      };
    } catch (error) {
      console.error('Error cleaning up old conversations:', error);
      throw error;
    }
  }
}
```

### **Extended Database Schema for Chat History**:

```sql
-- Add additional columns to conversations table for better history management
ALTER TABLE conversations ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN starred BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN tags JSONB DEFAULT '[]';
ALTER TABLE conversations ADD COLUMN last_accessed_at TIMESTAMP DEFAULT NOW();

-- Add full-text search capabilities
ALTER TABLE messages ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_messages_search_vector ON messages USING GIN(search_vector);

-- Create trigger to update search vector automatically
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.content_large, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_search_vector
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Conversation tags table for better organization
CREATE TABLE conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, tag_name)
);

-- Chat history statistics table for caching analytics
CREATE TABLE chat_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  statistic_date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  courses_used JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, statistic_date)
);
```

## 🚀 **Next Steps for Implementation**

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Design database schema for NeonDB integration", "status": "completed", "activeForm": "Designing database schema for NeonDB integration"}, {"content": "Set up NeonDB connection and configuration", "status": "in_progress", "activeForm": "Setting up NeonDB connection and configuration"}, {"content": "Implement database models with Drizzle ORM", "status": "pending", "activeForm": "Implementing database models with Drizzle ORM"}, {"content": "Create API routes for database operations", "status": "pending", "activeForm": "Creating API routes for database operations"}, {"content": "Implement dual-write strategy (SessionStorage + DB)", "status": "pending", "activeForm": "Implementing dual-write strategy"}, {"content": "Add migration system for existing SessionStorage data", "status": "pending", "activeForm": "Adding migration system for existing data"}, {"content": "Test database operations and optimize for large content", "status": "pending", "activeForm": "Testing database operations and optimization"}]