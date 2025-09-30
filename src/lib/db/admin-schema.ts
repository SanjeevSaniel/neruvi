import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema';

// User status enum for moderation
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned', 'pending']);

// Moderation action types
export const moderationActionEnum = pgEnum('moderation_action', [
  'warning', 'timeban', 'ban', 'unban', 'suspend', 'unsuspend', 'course_restrict', 'course_allow'
]);

// User profiles with extended information for admin management
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Profile information
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  bio: text('bio'),
  avatar: varchar('avatar', { length: 500 }),
  timezone: varchar('timezone', { length: 50 }),
  language: varchar('language', { length: 10 }).default('en'),

  // Course access
  nodeJsAccess: boolean('nodejs_access').default(true),
  pythonAccess: boolean('python_access').default(true),
  allCoursesAccess: boolean('all_courses_access').default(true),

  // Account status
  status: userStatusEnum('status').default('active').notNull(),
  statusReason: text('status_reason'),
  statusUntil: timestamp('status_until'), // For temporary bans

  // Activity tracking
  totalConversations: integer('total_conversations').default(0),
  totalMessages: integer('total_messages').default(0),
  lastActiveAt: timestamp('last_active_at'),

  // Metadata
  joinedAt: timestamp('joined_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
  statusIdx: index('idx_user_profiles_status').on(table.status),
  lastActiveIdx: index('idx_user_profiles_last_active').on(table.lastActiveAt),
}));

// Moderation actions log
export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetUserId: uuid('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moderatorId: uuid('moderator_id').notNull().references(() => users.id),

  // Action details
  action: moderationActionEnum('action').notNull(),
  reason: text('reason').notNull(),
  duration: integer('duration_hours'), // For timeban
  expiresAt: timestamp('expires_at'), // When action expires

  // Additional data
  metadata: jsonb('metadata').default('{}'), // Extra action-specific data
  isActive: boolean('is_active').default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by').references(() => users.id),
}, (table) => ({
  targetUserIdx: index('idx_moderation_actions_target_user').on(table.targetUserId),
  moderatorIdx: index('idx_moderation_actions_moderator').on(table.moderatorId),
  actionIdx: index('idx_moderation_actions_action').on(table.action),
  createdAtIdx: index('idx_moderation_actions_created_at').on(table.createdAt),
  activeIdx: index('idx_moderation_actions_active').on(table.isActive),
}));

// User warnings and strikes system
export const userWarnings = pgTable('user_warnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  issuedBy: uuid('issued_by').notNull().references(() => users.id),

  // Warning details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('low'), // low, medium, high, critical

  // Strike system
  strikeCount: integer('strike_count').default(1),
  isActive: boolean('is_active').default(true),
  acknowledgedAt: timestamp('acknowledged_at'),

  // Metadata
  relatedContent: jsonb('related_content').default('{}'), // Links to messages, conversations, etc.
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // Warnings can expire
}, (table) => ({
  userIdIdx: index('idx_user_warnings_user_id').on(table.userId),
  issuedByIdx: index('idx_user_warnings_issued_by').on(table.issuedBy),
  severityIdx: index('idx_user_warnings_severity').on(table.severity),
  activeIdx: index('idx_user_warnings_active').on(table.isActive),
}));

// System announcements and notifications
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id),

  // Content
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('general'), // general, maintenance, feature, warning
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent

  // Targeting
  targetRoles: jsonb('target_roles').default('["user", "moderator", "admin"]'),
  targetUsers: jsonb('target_users').default('[]'), // Specific user IDs

  // Status
  isActive: boolean('is_active').default(true),
  isPinned: boolean('is_pinned').default(false),
  showUntil: timestamp('show_until'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  authorIdx: index('idx_announcements_author').on(table.authorId),
  typeIdx: index('idx_announcements_type').on(table.type),
  activeIdx: index('idx_announcements_active').on(table.isActive),
  priorityIdx: index('idx_announcements_priority').on(table.priority),
}));

// User activity analytics
export const userActivity = pgTable('user_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Activity data
  date: timestamp('date').notNull(), // Daily activity record
  messagesCount: integer('messages_count').default(0),
  conversationsStarted: integer('conversations_started').default(0),
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  coursesAccessed: jsonb('courses_accessed').default('[]'),

  // Engagement metrics
  avgResponseLength: integer('avg_response_length').default(0),
  threadsCreated: integer('threads_created').default(0),
  threadsParticipated: integer('threads_participated').default(0),

  // Session info
  sessionsCount: integer('sessions_count').default(0),
  deviceInfo: jsonb('device_info').default('{}'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('idx_user_activity_user_date').on(table.userId, table.date),
  dateIdx: index('idx_user_activity_date').on(table.date),
}));

// Platform analytics
export const platformAnalytics = pgTable('platform_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Time period
  date: timestamp('date').notNull(),
  period: varchar('period', { length: 20 }).default('daily'), // daily, weekly, monthly

  // User metrics
  activeUsers: integer('active_users').default(0),
  newUsers: integer('new_users').default(0),
  totalUsers: integer('total_users').default(0),
  bannedUsers: integer('banned_users').default(0),

  // Content metrics
  totalMessages: integer('total_messages').default(0),
  totalConversations: integer('total_conversations').default(0),
  avgConversationLength: integer('avg_conversation_length').default(0),

  // Course metrics
  nodeJsUsers: integer('nodejs_users').default(0),
  pythonUsers: integer('python_users').default(0),

  // Moderation metrics
  moderationActions: integer('moderation_actions').default(0),
  warningsIssued: integer('warnings_issued').default(0),
  bansIssued: integer('bans_issued').default(0),

  // Performance metrics
  avgResponseTime: integer('avg_response_time_ms').default(0),
  errorRate: integer('error_rate_percent').default(0),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dateIdx: index('idx_platform_analytics_date').on(table.date),
  periodIdx: index('idx_platform_analytics_period').on(table.period),
}));

// Content reports and flagging
export const contentReports = pgTable('content_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),

  // Reported content
  contentType: varchar('content_type', { length: 50 }).notNull(), // message, conversation, user
  contentId: uuid('content_id').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  description: text('description'),

  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, reviewed, resolved, dismissed
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  resolution: text('resolution'),

  // Priority
  priority: varchar('priority', { length: 20 }).default('normal'),
  isAutoGenerated: boolean('is_auto_generated').default(false),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  reporterIdx: index('idx_content_reports_reporter').on(table.reporterId),
  contentIdx: index('idx_content_reports_content').on(table.contentType, table.contentId),
  statusIdx: index('idx_content_reports_status').on(table.status),
  priorityIdx: index('idx_content_reports_priority').on(table.priority),
}));

// Define relations
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
  }),
  moderator: one(users, {
    fields: [moderationActions.moderatorId],
    references: [users.id],
  }),
}));

export const userWarningsRelations = relations(userWarnings, ({ one }) => ({
  user: one(users, {
    fields: [userWarnings.userId],
    references: [users.id],
  }),
  issuedBy: one(users, {
    fields: [userWarnings.issuedBy],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));