import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define user role enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator']);

// Admin-related enums
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned', 'pending']);
export const moderationActionEnum = pgEnum('moderation_action', [
  'warn', 'timeban', 'ban', 'unban', 'course_restrict', 'course_allow'
]);
export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'resolved', 'dismissed']);

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

// Admin Tables

// User Profiles for extended admin info
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  status: userStatusEnum('status').default('active').notNull(),
  statusReason: text('status_reason'),
  statusUntil: timestamp('status_until'),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  lastActiveAt: timestamp('last_active_at').defaultNow(),

  // Course access permissions
  nodeJsAccess: boolean('nodejs_access').default(true),
  pythonAccess: boolean('python_access').default(true),
  allCoursesAccess: boolean('all_courses_access').default(false),

  // Security settings
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),

  // Metadata
  preferences: jsonb('preferences').default('{}'),
  metadata: jsonb('metadata').default('{}'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
  statusIdx: index('idx_user_profiles_status').on(table.status),
  lastActiveIdx: index('idx_user_profiles_last_active').on(table.lastActiveAt),
}));

// Moderation Actions Log
export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetUserId: uuid('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moderatorId: uuid('moderator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: moderationActionEnum('action').notNull(),
  reason: text('reason').notNull(),
  duration: integer('duration'), // hours for timeban
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  targetUserIdx: index('idx_moderation_actions_target_user').on(table.targetUserId),
  moderatorIdx: index('idx_moderation_actions_moderator').on(table.moderatorId),
  actionIdx: index('idx_moderation_actions_action').on(table.action),
  createdAtIdx: index('idx_moderation_actions_created_at').on(table.createdAt),
  activeIdx: index('idx_moderation_actions_active').on(table.isActive),
}));

// User Warnings System
export const userWarnings = pgTable('user_warnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  issuedBy: uuid('issued_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  severity: severityEnum('severity').default('low').notNull(),
  strikeCount: integer('strike_count').default(1),
  isActive: boolean('is_active').default(true),
  acknowledgedAt: timestamp('acknowledged_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_warnings_user_id').on(table.userId),
  issuedByIdx: index('idx_user_warnings_issued_by').on(table.issuedBy),
  severityIdx: index('idx_user_warnings_severity').on(table.severity),
  activeIdx: index('idx_user_warnings_active').on(table.isActive),
  createdAtIdx: index('idx_user_warnings_created_at').on(table.createdAt),
}));

// System Announcements
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('general'),
  priority: varchar('priority', { length: 20 }).default('normal'),
  targetRoles: jsonb('target_roles').default('["user", "moderator", "admin"]'),
  targetUsers: jsonb('target_users').default('[]'),
  isActive: boolean('is_active').default(true),
  isPinned: boolean('is_pinned').default(false),
  showFrom: timestamp('show_from').defaultNow(),
  showUntil: timestamp('show_until'),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  authorIdx: index('idx_announcements_author').on(table.authorId),
  typeIdx: index('idx_announcements_type').on(table.type),
  activeIdx: index('idx_announcements_active').on(table.isActive),
  showDatesIdx: index('idx_announcements_show_dates').on(table.showFrom, table.showUntil),
  pinnedIdx: index('idx_announcements_pinned').on(table.isPinned),
}));

// User Activity Tracking
export const userActivity = pgTable('user_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  conversationsCreated: integer('conversations_created').default(0),
  messagesExchanged: integer('messages_exchanged').default(0),
  tokensUsed: integer('tokens_used').default(0),
  coursesAccessed: jsonb('courses_accessed').default('[]'),
  featuresUsed: jsonb('features_used').default('[]'),
  sessionCount: integer('session_count').default(0),
  totalSessionTime: integer('total_session_time').default(0), // minutes
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('idx_user_activity_user_date').on(table.userId, table.date),
  dateIdx: index('idx_user_activity_date').on(table.date),
}));

// Platform Analytics
export const platformAnalytics = pgTable('platform_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull().unique(),
  activeUsers: integer('active_users').default(0),
  newUsers: integer('new_users').default(0),
  totalConversations: integer('total_conversations').default(0),
  totalMessages: integer('total_messages').default(0),
  totalTokens: integer('total_tokens').default(0),
  averageSessionTime: integer('average_session_time').default(0), // minutes
  topCourses: jsonb('top_courses').default('[]'),
  moderationActions: integer('moderation_actions').default(0),
  reportedContent: integer('reported_content').default(0),
  systemUptime: integer('system_uptime').default(0), // percentage
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dateIdx: index('idx_platform_analytics_date').on(table.date),
}));

// Content Reports
export const contentReports = pgTable('content_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'message', 'conversation', 'user_profile'
  contentId: uuid('content_id').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 20 }).default('normal'),
  status: reportStatusEnum('status').default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  resolution: text('resolution'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  reporterIdx: index('idx_content_reports_reporter').on(table.reporterId),
  contentIdx: index('idx_content_reports_content').on(table.contentType, table.contentId),
  statusIdx: index('idx_content_reports_status').on(table.status),
  priorityIdx: index('idx_content_reports_priority').on(table.priority),
  createdAtIdx: index('idx_content_reports_created_at').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  conversations: many(conversations),
  usage: many(userUsage),
  tags: many(conversationTags),
  statistics: many(chatStatistics),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  moderationActionsAsTarget: many(moderationActions, { relationName: 'targetUser' }),
  moderationActionsAsModerator: many(moderationActions, { relationName: 'moderator' }),
  warningsIssued: many(userWarnings, { relationName: 'issuer' }),
  warningsReceived: many(userWarnings, { relationName: 'recipient' }),
  announcements: many(announcements),
  activity: many(userActivity),
  contentReports: many(contentReports),
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

// Admin Table Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const moderationActionsRelations = relations(moderationActions, ({ one }) => ({
  targetUser: one(users, {
    fields: [moderationActions.targetUserId],
    references: [users.id],
    relationName: 'targetUser',
  }),
  moderator: one(users, {
    fields: [moderationActions.moderatorId],
    references: [users.id],
    relationName: 'moderator',
  }),
  revokedByUser: one(users, {
    fields: [moderationActions.revokedBy],
    references: [users.id],
  }),
}));

export const userWarningsRelations = relations(userWarnings, ({ one }) => ({
  user: one(users, {
    fields: [userWarnings.userId],
    references: [users.id],
    relationName: 'recipient',
  }),
  issuer: one(users, {
    fields: [userWarnings.issuedBy],
    references: [users.id],
    relationName: 'issuer',
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, {
    fields: [contentReports.reporterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [contentReports.reviewedBy],
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

// Admin table types
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type ModerationAction = typeof moderationActions.$inferSelect;
export type NewModerationAction = typeof moderationActions.$inferInsert;

export type UserWarning = typeof userWarnings.$inferSelect;
export type NewUserWarning = typeof userWarnings.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type UserActivity = typeof userActivity.$inferSelect;
export type NewUserActivity = typeof userActivity.$inferInsert;

export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type NewPlatformAnalytics = typeof platformAnalytics.$inferInsert;

export type ContentReport = typeof contentReports.$inferSelect;
export type NewContentReport = typeof contentReports.$inferInsert;