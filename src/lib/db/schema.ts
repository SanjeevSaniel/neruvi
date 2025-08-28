import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define user role enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator']);

// Users table - synced with Clerk
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  role: userRoleEnum('role').default('user').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkIdIdx: index('idx_users_clerk_id').on(table.clerkId),
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  selectedCourse: varchar('selected_course', { length: 50 }),
  messageCount: integer('message_count').default(0),
  totalTokens: integer('total_tokens').default(0),
  archived: boolean('archived').default(false),
  starred: boolean('starred').default(false),
  tags: jsonb('tags').default('[]'),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_conversations_user_id').on(table.userId),
  createdAtIdx: index('idx_conversations_created_at').on(table.createdAt),
  userCourseIdx: index('idx_conversations_user_course').on(table.userId, table.selectedCourse),
  userUpdatedAtIdx: index('idx_conversations_user_updated_at').on(table.userId, table.updatedAt),
}));

// Messages table - optimized for long content storage
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  
  // Multi-tier content storage
  content: text('content').notNull(),
  contentLarge: text('content_large'),
  contentCompressed: text('content_compressed'), // Will store base64 encoded compressed data
  contentExternalUrl: varchar('content_external_url', { length: 500 }),
  
  // Metadata
  tokenCount: integer('token_count').default(0),
  characterCount: integer('character_count').default(0),
  contentType: varchar('content_type', { length: 20 }).default('text'),
  compressionType: varchar('compression_type', { length: 20 }),
  
  // Assistant message sources
  sources: jsonb('sources').default('[]'),
  
  // Timing and performance
  createdAt: timestamp('created_at').defaultNow(),
  processingTimeMs: integer('processing_time_ms'),
}, (table) => ({
  conversationIdIdx: index('idx_messages_conversation_id').on(table.conversationId),
  createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
  roleIdx: index('idx_messages_role').on(table.role),
  contentSizeIdx: index('idx_messages_content_size').on(table.characterCount),
  conversationCreatedAtIdx: index('idx_messages_conversation_created_at').on(table.conversationId, table.createdAt),
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
  messageIdOrderIdx: index('idx_message_chunks_message_id_order').on(table.messageId, table.chunkOrder),
}));

// User usage tracking for rate limiting
export const userUsage = pgTable('user_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageCount: integer('message_count').default(0),
  lastResetAt: timestamp('last_reset_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_usage_user_id').on(table.userId),
}));

// Conversation tags for organization
export const conversationTags = pgTable('conversation_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tagName: varchar('tag_name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6B7280'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdTagNameIdx: index('idx_conversation_tags_user_tag').on(table.userId, table.tagName),
}));

// Chat statistics for analytics caching
export const chatStatistics = pgTable('chat_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  statisticDate: timestamp('statistic_date').notNull(),
  totalConversations: integer('total_conversations').default(0),
  totalMessages: integer('total_messages').default(0),
  totalTokens: integer('total_tokens').default(0),
  coursesUsed: jsonb('courses_used').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('idx_chat_statistics_user_date').on(table.userId, table.statisticDate),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  usage: many(userUsage),
  tags: many(conversationTags),
  statistics: many(chatStatistics),
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

export const messageChunksRelations = relations(messageChunks, ({ one }) => ({
  message: one(messages, {
    fields: [messageChunks.messageId],
    references: [messages.id],
  }),
}));

export const userUsageRelations = relations(userUsage, ({ one }) => ({
  user: one(users, {
    fields: [userUsage.userId],
    references: [users.id],
  }),
}));

export const conversationTagsRelations = relations(conversationTags, ({ one }) => ({
  user: one(users, {
    fields: [conversationTags.userId],
    references: [users.id],
  }),
}));

export const chatStatisticsRelations = relations(chatStatistics, ({ one }) => ({
  user: one(users, {
    fields: [chatStatistics.userId],
    references: [users.id],
  }),
}));

// Export types
export type UserRole = 'user' | 'admin' | 'moderator';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageChunk = typeof messageChunks.$inferSelect;
export type NewMessageChunk = typeof messageChunks.$inferInsert;

export type UserUsage = typeof userUsage.$inferSelect;
export type NewUserUsage = typeof userUsage.$inferInsert;

export type ConversationTag = typeof conversationTags.$inferSelect;
export type NewConversationTag = typeof conversationTags.$inferInsert;

export type ChatStatistic = typeof chatStatistics.$inferSelect;
export type NewChatStatistic = typeof chatStatistics.$inferInsert;