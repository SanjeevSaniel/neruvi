import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AdminService } from '@/lib/admin/admin-service';
import { hasPermission, PERMISSIONS, UserRole, canModerateUser } from '@/lib/admin/permissions';
import { isDatabaseEnabled } from '@/lib/db/connection';

const getAdminService = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database connection string not found');
  }
  return new AdminService({ connectionString });
};

async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const adminService = getAdminService();
    const userProfile = await adminService.getUserProfile(userId);
    return (userProfile?.user?.role as UserRole) || 'user';
  } catch (error) {
    return 'user';
  }
}

// POST /api/admin/moderation - Perform moderation actions
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const moderatorRole = await getUserRole(userId);
    const body = await request.json();
    const { action, targetUserId, reason, ...actionData } = body;

    if (!action || !targetUserId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get target user role to check if moderation is allowed
    const targetUserRole = await getUserRole(targetUserId);
    if (!canModerateUser(moderatorRole, targetUserRole)) {
      return NextResponse.json(
        { error: 'Cannot moderate user with equal or higher role' },
        { status: 403 }
      );
    }

    const adminService = getAdminService();

    switch (action) {
      case 'ban':
        if (!hasPermission(moderatorRole, PERMISSIONS.MODERATION_BAN)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        await adminService.banUser(targetUserId, userId, reason);
        break;

      case 'timeban':
        if (!hasPermission(moderatorRole, PERMISSIONS.MODERATION_TIMEBAN)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        if (!actionData.duration) {
          return NextResponse.json(
            { error: 'Duration required for timeban' },
            { status: 400 }
          );
        }

        await adminService.banUser(targetUserId, userId, reason, actionData.duration);
        break;

      case 'unban':
        if (!hasPermission(moderatorRole, PERMISSIONS.MODERATION_UNBAN)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        await adminService.unbanUser(targetUserId, userId, reason);
        break;

      case 'warn':
        if (!hasPermission(moderatorRole, PERMISSIONS.MODERATION_WARN)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        await adminService.issueWarning(targetUserId, userId, {
          title: actionData.title || 'Warning',
          description: reason,
          severity: actionData.severity || 'low',
          strikeCount: actionData.strikeCount || 1,
          expiresAt: actionData.expiresAt ? new Date(actionData.expiresAt) : undefined
        });
        break;

      case 'bulk':
        if (!hasPermission(moderatorRole, PERMISSIONS.BULK_MODERATION)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        if (!actionData.userIds || !Array.isArray(actionData.userIds)) {
          return NextResponse.json(
            { error: 'userIds array required for bulk action' },
            { status: 400 }
          );
        }

        await adminService.bulkUserAction(
          actionData.userIds,
          actionData.bulkAction,
          userId,
          reason,
          actionData.metadata
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${action} action completed successfully`
    });

  } catch (error) {
    console.error('Error performing moderation action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/moderation - Get moderation history
export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(userId);

    if (!hasPermission(userRole, PERMISSIONS.MODERATION_VIEW_HISTORY)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    const adminService = getAdminService();

    let history;
    if (targetUserId) {
      // Get history for specific user
      history = await adminService.getModerationHistory(targetUserId);
    } else {
      // Get recent moderation actions across all users
      history = await adminService.getRecentModerationActions(20);
    }

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching moderation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}