/**
 * Database Schema Extensions for Threading and Tracing
 * Extends the existing schema with threading capabilities
 */

import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { conversations, messages } from '@/lib/db/schema';

// Conversation Threads table - manages thread hierarchy
export const conversationThreads = pgTable('conversation_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  rootMessageId: uuid('root_message_id').references(() => messages.id, { onDelete: 'cascade' }),
  currentMessageId: uuid('current_message_id').references(() => messages.id, { onDelete: 'set null' }),
  messageCount: integer('message_count').default(0),
  isMainThread: boolean('is_main_thread').default(false),
  isActive: boolean('is_active').default(true),
  branchedFromThreadId: uuid('branched_from_thread_id').references(() => conversationThreads.id, { onDelete: 'set null' }),
  branchedFromMessageId: uuid('branched_from_message_id').references(() => messages.id, { onDelete: 'set null' }),
  branchReason: varchar('branch_reason', { length: 500 }),
  priority: integer('priority').default(0), // Higher priority = more important thread
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  conversationIdIdx: index('idx_threads_conversation_id').on(table.conversationId),
  rootMessageIdx: index('idx_threads_root_message').on(table.rootMessageId),
  isActiveIdx: index('idx_threads_is_active').on(table.isActive),
  conversationActiveIdx: index('idx_threads_conversation_active').on(table.conversationId, table.isActive),
  branchedFromIdx: index('idx_threads_branched_from').on(table.branchedFromThreadId, table.branchedFromMessageId),
}));

// Message Traces table - tracks message lineage and relationships
export const messageTraces = pgTable('message_traces', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }).unique(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').notNull().references(() => conversationThreads.id, { onDelete: 'cascade' }),
  parentMessageId: uuid('parent_message_id').references(() => messages.id, { onDelete: 'cascade' }),
  depth: integer('depth').default(0),
  position: integer('position').default(0), // Position among siblings
  lineage: jsonb('lineage').default('[]'), // Array of message IDs from root
  
  // Branching metadata
  isBranchPoint: boolean('is_branch_point').default(false),
  branchCount: integer('branch_count').default(0),
  originalMessageId: uuid('original_message_id').references(() => messages.id, { onDelete: 'set null' }), // If this is a branch/regeneration
  
  // Message metadata
  isRegeneratedResponse: boolean('is_regenerated_response').default(false),
  isEditedMessage: boolean('is_edited_message').default(false),
  isAlternativeResponse: boolean('is_alternative_response').default(false),
  userFeedback: varchar('user_feedback', { length: 20 }), // 'positive' | 'negative' | 'regenerate'
  
  // Performance tracking
  processingTimeMs: integer('processing_time_ms'),
  tokenCount: integer('token_count'),
  confidenceScore: integer('confidence_score'), // 0-100
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  messageIdIdx: index('idx_traces_message_id').on(table.messageId),
  threadIdIdx: index('idx_traces_thread_id').on(table.threadId),
  parentMessageIdx: index('idx_traces_parent_message').on(table.parentMessageId),
  conversationDepthIdx: index('idx_traces_conversation_depth').on(table.conversationId, table.depth),
  branchPointIdx: index('idx_traces_branch_point').on(table.isBranchPoint),
  threadPositionIdx: index('idx_traces_thread_position').on(table.threadId, table.position),
}));

// Thread Actions table - logs all threading operations for audit/undo
export const threadActions = pgTable('thread_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').references(() => conversationThreads.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'CREATE_BRANCH', 'SWITCH_THREAD', etc.
  actionData: jsonb('action_data').default('{}'),
  userId: uuid('user_id').notNull(), // Who performed the action
  reversible: boolean('reversible').default(true),
  undoData: jsonb('undo_data'), // Data needed to undo this action
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  conversationIdIdx: index('idx_actions_conversation_id').on(table.conversationId),
  threadIdIdx: index('idx_actions_thread_id').on(table.threadId),
  actionTypeIdx: index('idx_actions_type').on(table.actionType),
  userIdIdx: index('idx_actions_user_id').on(table.userId),
  createdAtIdx: index('idx_actions_created_at').on(table.createdAt),
}));

// Relations
export const conversationThreadsRelations = relations(conversationThreads, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [conversationThreads.conversationId],
    references: [conversations.id],
  }),
  rootMessage: one(messages, {
    fields: [conversationThreads.rootMessageId],
    references: [messages.id],
  }),
  currentMessage: one(messages, {
    fields: [conversationThreads.currentMessageId],
    references: [messages.id],
  }),
  branchedFromThread: one(conversationThreads, {
    fields: [conversationThreads.branchedFromThreadId],
    references: [conversationThreads.id],
    relationName: 'threadBranches'
  }),
  childThreads: many(conversationThreads, {
    relationName: 'threadBranches'
  }),
  messageTraces: many(messageTraces),
  threadActions: many(threadActions),
}));

export const messageTracesRelations = relations(messageTraces, ({ one, many }) => ({
  message: one(messages, {
    fields: [messageTraces.messageId],
    references: [messages.id],
  }),
  conversation: one(conversations, {
    fields: [messageTraces.conversationId],
    references: [conversations.id],
  }),
  thread: one(conversationThreads, {
    fields: [messageTraces.threadId],
    references: [conversationThreads.id],
  }),
  parentMessage: one(messages, {
    fields: [messageTraces.parentMessageId],
    references: [messages.id],
  }),
  originalMessage: one(messages, {
    fields: [messageTraces.originalMessageId],
    references: [messages.id],
  }),
}));

export const threadActionsRelations = relations(threadActions, ({ one }) => ({
  conversation: one(conversations, {
    fields: [threadActions.conversationId],
    references: [conversations.id],
  }),
  thread: one(conversationThreads, {
    fields: [threadActions.threadId],
    references: [conversationThreads.id],
  }),
  message: one(messages, {
    fields: [threadActions.messageId],
    references: [messages.id],
  }),
}));