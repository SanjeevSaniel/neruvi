import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { AdminService } from '@/lib/admin/admin-service';
import { isDatabaseEnabled } from '@/lib/db/connection';
import type { User } from '@/lib/db/schema';

const getAdminService = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database connection string not found');
  }
  return new AdminService({ connectionString });
};

// GET /api/admin/analytics/dashboard - Get dashboard analytics
export const GET = withAdmin(async (user: User, request: NextRequest) => {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const adminService = getAdminService();
    const stats = await adminService.getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});