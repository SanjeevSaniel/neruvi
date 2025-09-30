import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { and, eq, desc, asc, gte, lte, count, sql, inArray, or, like } from 'drizzle-orm';
import {
  users,
  conversations,
  messages,
  userProfiles,
  moderationActions,
  userWarnings,
  announcements,
  userActivity,
  platformAnalytics,
  contentReports,
  userStatusEnum,
  moderationActionEnum
} from '@/lib/db/schema';

interface DatabaseConnection {
  connectionString: string;
}

export class AdminService {
  private db: ReturnType<typeof drizzle>;

  constructor(connection: DatabaseConnection) {
    const sql = neon(connection.connectionString);
    this.db = drizzle(sql);
  }

  // User Management
  async getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const orderColumn = sortOrder === 'desc' ? desc : asc;

    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.displayName, `%${search}%`)
        )
      );
    }

    if (role) {
      whereConditions.push(eq(users.role, role as any));
    }

    if (status) {
      whereConditions.push(eq(userProfiles.status, status as any));
    }

    const result = await this.db
      .select({
        user: users,
        profile: userProfiles,
        totalConversations: sql<number>`COUNT(DISTINCT ${conversations.id})`,
        totalMessages: sql<number>`COUNT(DISTINCT ${messages.id})`,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(conversations, eq(users.id, conversations.userId))
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .where(whereConditions.length ? and(...whereConditions) : undefined)
      .groupBy(users.id, userProfiles.id)
      .orderBy(orderColumn(users[sortBy as keyof typeof users]))
      .limit(limit)
      .offset(offset);

    const totalCount = await this.db
      .select({ count: count() })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    return {
      users: result,
      totalCount: totalCount[0].count,
      hasMore: (page * limit) < totalCount[0].count
    };
  }

  async getUserProfile(userId: string) {
    const result = await this.db
      .select({
        user: users,
        profile: userProfiles,
        warnings: sql<number>`COUNT(DISTINCT ${userWarnings.id})`,
        moderationActions: sql<number>`COUNT(DISTINCT ${moderationActions.id})`,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(userWarnings, and(eq(userWarnings.userId, users.id), eq(userWarnings.isActive, true)))
      .leftJoin(moderationActions, and(eq(moderationActions.targetUserId, users.id), eq(moderationActions.isActive, true)))
      .where(eq(users.id, userId))
      .groupBy(users.id, userProfiles.id);

    return result[0] || null;
  }

  async updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin', updatedBy: string) {
    return await this.db.transaction(async (tx) => {
      // Update user role
      await tx
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Log moderation action
      await tx.insert(moderationActions).values({
        targetUserId: userId,
        moderatorId: updatedBy,
        action: role === 'admin' ? 'course_allow' : role === 'moderator' ? 'course_allow' : 'course_restrict',
        reason: `Role changed to ${role}`,
        metadata: { previousRole: role, newRole: role }
      });

      return true;
    });
  }

  // Moderation System
  async banUser(userId: string, moderatorId: string, reason: string, duration?: number) {
    return await this.db.transaction(async (tx) => {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

      // Update user profile status
      await tx
        .update(userProfiles)
        .set({
          status: duration ? 'suspended' : 'banned',
          statusReason: reason,
          statusUntil: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));

      // Log moderation action
      await tx.insert(moderationActions).values({
        targetUserId: userId,
        moderatorId,
        action: duration ? 'timeban' : 'ban',
        reason,
        duration,
        expiresAt,
        metadata: { type: duration ? 'temporary' : 'permanent' }
      });

      return true;
    });
  }

  async unbanUser(userId: string, moderatorId: string, reason: string) {
    return await this.db.transaction(async (tx) => {
      // Update user profile status
      await tx
        .update(userProfiles)
        .set({
          status: 'active',
          statusReason: null,
          statusUntil: null,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));

      // Deactivate previous ban
      await tx
        .update(moderationActions)
        .set({ isActive: false, revokedAt: new Date(), revokedBy: moderatorId })
        .where(
          and(
            eq(moderationActions.targetUserId, userId),
            inArray(moderationActions.action, ['ban', 'timeban']),
            eq(moderationActions.isActive, true)
          )
        );

      // Log unban action
      await tx.insert(moderationActions).values({
        targetUserId: userId,
        moderatorId,
        action: 'unban',
        reason,
        metadata: { type: 'manual_unban' }
      });

      return true;
    });
  }

  async issueWarning(userId: string, issuedBy: string, warning: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    strikeCount?: number;
    expiresAt?: Date;
  }) {
    return await this.db.insert(userWarnings).values({
      userId,
      issuedBy,
      title: warning.title,
      description: warning.description,
      severity: warning.severity,
      strikeCount: warning.strikeCount || 1,
      expiresAt: warning.expiresAt
    });
  }

  async getUserWarnings(userId: string, activeOnly = true) {
    return await this.db
      .select({
        warning: userWarnings,
        issuedByUser: {
          id: users.id,
          email: users.email,
          displayName: users.displayName
        }
      })
      .from(userWarnings)
      .leftJoin(users, eq(userWarnings.issuedBy, users.id))
      .where(
        and(
          eq(userWarnings.userId, userId),
          activeOnly ? eq(userWarnings.isActive, true) : undefined
        )
      )
      .orderBy(desc(userWarnings.createdAt));
  }

  async getModerationHistory(userId: string) {
    return await this.db
      .select({
        action: moderationActions,
        moderator: {
          id: users.id,
          email: users.email,
          displayName: users.displayName
        }
      })
      .from(moderationActions)
      .leftJoin(users, eq(moderationActions.moderatorId, users.id))
      .where(eq(moderationActions.targetUserId, userId))
      .orderBy(desc(moderationActions.createdAt));
  }

  async getRecentModerationActions(limit = 20) {
    return await this.db
      .select({
        id: moderationActions.id,
        action: moderationActions.action,
        reason: moderationActions.reason,
        duration: moderationActions.duration,
        expiresAt: moderationActions.expiresAt,
        createdAt: moderationActions.createdAt,
        moderator: {
          id: sql<string>`moderator.id`,
          email: sql<string>`moderator.email`,
          displayName: sql<string>`moderator.display_name`
        },
        targetUser: {
          id: sql<string>`target.id`,
          email: sql<string>`target.email`,
          displayName: sql<string>`target.display_name`
        }
      })
      .from(moderationActions)
      .leftJoin(sql`users as moderator`, eq(moderationActions.moderatorId, sql`moderator.id`))
      .leftJoin(sql`users as target`, eq(moderationActions.targetUserId, sql`target.id`))
      .orderBy(desc(moderationActions.createdAt))
      .limit(limit);
  }

  // Course Access Management
  async updateCourseAccess(userId: string, moderatorId: string, courses: {
    nodeJsAccess?: boolean;
    pythonAccess?: boolean;
    allCoursesAccess?: boolean;
  }) {
    return await this.db.transaction(async (tx) => {
      // Update course access
      await tx
        .update(userProfiles)
        .set({
          ...courses,
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, userId));

      // Log action
      await tx.insert(moderationActions).values({
        targetUserId: userId,
        moderatorId,
        action: 'course_restrict',
        reason: 'Course access updated',
        metadata: { courseAccess: courses }
      });

      return true;
    });
  }

  // Analytics
  async getPlatformAnalytics(startDate: Date, endDate: Date) {
    return await this.db
      .select()
      .from(platformAnalytics)
      .where(
        and(
          gte(platformAnalytics.date, startDate),
          lte(platformAnalytics.date, endDate)
        )
      )
      .orderBy(asc(platformAnalytics.date));
  }

  async getUserAnalytics(userId: string, startDate: Date, endDate: Date) {
    return await this.db
      .select()
      .from(userActivity)
      .where(
        and(
          eq(userActivity.userId, userId),
          gte(userActivity.date, startDate),
          lte(userActivity.date, endDate)
        )
      )
      .orderBy(asc(userActivity.date));
  }

  async getDashboardStats() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, totalConversations, totalMessages, moderationActionsCount] = await Promise.all([
      this.db.select({ count: count() }).from(users),
      this.db.select({ count: count() }).from(userProfiles).where(gte(userProfiles.lastActiveAt, weekAgo)),
      this.db.select({ count: count() }).from(conversations),
      this.db.select({ count: count() }).from(messages),
      this.db.select({ count: count() }).from(moderationActions).where(gte(moderationActions.createdAt, weekAgo))
    ]);

    return {
      totalUsers: totalUsers[0].count,
      activeUsers: activeUsers[0].count,
      totalConversations: totalConversations[0].count,
      totalMessages: totalMessages[0].count,
      moderationActions: moderationActionsCount[0].count
    };
  }

  // Announcements
  async createAnnouncement(authorId: string, announcement: {
    title: string;
    content: string;
    type?: string;
    priority?: string;
    targetRoles?: string[];
    targetUsers?: string[];
    isPinned?: boolean;
    showUntil?: Date;
  }) {
    return await this.db.insert(announcements).values({
      authorId,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'general',
      priority: announcement.priority || 'normal',
      targetRoles: announcement.targetRoles || ['user', 'moderator', 'admin'],
      targetUsers: announcement.targetUsers || [],
      isPinned: announcement.isPinned || false,
      showUntil: announcement.showUntil
    });
  }

  async getActiveAnnouncements(userRole: string, userId?: string) {
    const now = new Date();

    return await this.db
      .select({
        announcement: announcements,
        author: {
          id: users.id,
          email: users.email,
          displayName: users.displayName
        }
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .where(
        and(
          eq(announcements.isActive, true),
          or(
            gte(announcements.showUntil, now),
            eq(announcements.showUntil, null)
          ),
          or(
            sql`${announcements.targetRoles} @> ${JSON.stringify([userRole])}`,
            userId ? sql`${announcements.targetUsers} @> ${JSON.stringify([userId])}` : sql`false`
          )
        )
      )
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  // Bulk Operations
  async bulkUserAction(userIds: string[], action: string, moderatorId: string, reason: string, metadata?: any) {
    return await this.db.transaction(async (tx) => {
      const actions = userIds.map(userId => ({
        targetUserId: userId,
        moderatorId,
        action: action as any,
        reason,
        metadata: metadata || {}
      }));

      await tx.insert(moderationActions).values(actions);

      // Apply the actual changes based on action type
      if (action === 'ban') {
        await tx
          .update(userProfiles)
          .set({ status: 'banned', statusReason: reason, updatedAt: new Date() })
          .where(inArray(userProfiles.userId, userIds));
      } else if (action === 'unban') {
        await tx
          .update(userProfiles)
          .set({ status: 'active', statusReason: null, statusUntil: null, updatedAt: new Date() })
          .where(inArray(userProfiles.userId, userIds));
      }

      return true;
    });
  }

  // Content Reports
  async reportContent(reporterId: string, report: {
    contentType: string;
    contentId: string;
    reason: string;
    description?: string;
    priority?: string;
  }) {
    return await this.db.insert(contentReports).values({
      reporterId,
      contentType: report.contentType,
      contentId: report.contentId,
      reason: report.reason,
      description: report.description,
      priority: report.priority || 'normal'
    });
  }

  async getContentReports(status?: string) {
    return await this.db
      .select({
        report: contentReports,
        reporter: {
          id: users.id,
          email: users.email,
          displayName: users.displayName
        }
      })
      .from(contentReports)
      .leftJoin(users, eq(contentReports.reporterId, users.id))
      .where(status ? eq(contentReports.status, status) : undefined)
      .orderBy(desc(contentReports.createdAt));
  }

  async resolveContentReport(reportId: string, reviewerId: string, resolution: string, status: string) {
    return await this.db
      .update(contentReports)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        resolution
      })
      .where(eq(contentReports.id, reportId));
  }
}