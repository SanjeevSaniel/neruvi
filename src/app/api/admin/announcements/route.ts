import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withAdmin } from '@/lib/auth/middleware';
import { AdminService } from '@/lib/admin/admin-service';
import { isDatabaseEnabled } from '@/lib/db/connection';
import { hasPermission, PERMISSIONS } from '@/lib/admin/permissions';
import type { User, UserRole } from '@/lib/db/schema';

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

// GET /api/admin/announcements - Get announcements
export const GET = withAdmin(async (user: User, request: NextRequest) => {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const adminService = getAdminService();
    const announcements = await adminService.getActiveAnnouncements(user.role, user.clerkId);

    return NextResponse.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/admin/announcements - Create announcement
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

    const userRole = await getUserRole(userId);

    if (!hasPermission(userRole, PERMISSIONS.COMMUNICATION_ANNOUNCEMENT)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      priority,
      targetRoles,
      targetUsers,
      isPinned,
      showUntil
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminService = getAdminService();
    await adminService.createAnnouncement(userId, {
      title,
      content,
      type,
      priority,
      targetRoles,
      targetUsers,
      isPinned,
      showUntil: showUntil ? new Date(showUntil) : undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}