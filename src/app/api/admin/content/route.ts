import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AdminService } from '@/lib/admin/admin-service';
import { hasPermission, PERMISSIONS, UserRole } from '@/lib/admin/permissions';
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

// GET /api/admin/content - Get content reports
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

    if (!hasPermission(userRole, PERMISSIONS.CONTENT_VIEW_REPORTS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const adminService = getAdminService();
    const reports = await adminService.getContentReports(status);

    return NextResponse.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Error fetching content reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content - Create content report
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
    const body = await request.json();
    const { contentType, contentId, reason, description, priority } = body;

    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminService = getAdminService();
    await adminService.reportContent(userId, {
      contentType,
      contentId,
      reason,
      description,
      priority
    });

    return NextResponse.json({
      success: true,
      message: 'Content report created successfully'
    });

  } catch (error) {
    console.error('Error creating content report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/content - Resolve content report
export async function PUT(request: NextRequest) {
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

    if (!hasPermission(userRole, PERMISSIONS.CONTENT_RESOLVE_REPORTS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, resolution, status } = body;

    if (!reportId || !resolution || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminService = getAdminService();
    await adminService.resolveContentReport(reportId, userId, resolution, status);

    return NextResponse.json({
      success: true,
      message: 'Content report resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving content report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}