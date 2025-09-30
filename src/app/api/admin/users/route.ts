import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { AdminService } from '@/lib/admin/admin-service';
import { isDatabaseEnabled } from '@/lib/db/connection';
import type { User } from '@/lib/db/schema';

// Initialize AdminService
const getAdminService = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database connection string not found');
  }
  return new AdminService({ connectionString });
};

// GET /api/admin/users - Get all users with filtering
export const GET = withAdmin(async (user: User, request: NextRequest) => {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const adminService = getAdminService();
    const result = await adminService.getAllUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/users - Update user role or status
export const PUT = withAdmin(async (user: User, request: NextRequest) => {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { targetUserId, action, ...actionData } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import database utilities directly for simpler updates
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { neon } = await import('@neondatabase/serverless');
    const { users, userProfiles } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }

    const sql = neon(connectionString);
    const db = drizzle(sql);

    switch (action) {
      case 'updateUser':
        // Handle inline user updates (role, displayName, status)
        const updates: any = {};
        const profileUpdates: any = {};

        if (actionData.displayName !== undefined) {
          updates.displayName = actionData.displayName;
        }
        if (actionData.role !== undefined) {
          updates.role = actionData.role;
        }
        if (actionData.status !== undefined) {
          profileUpdates.status = actionData.status;
        }

        // Update user table
        if (Object.keys(updates).length > 0) {
          await db.update(users)
            .set(updates)
            .where(eq(users.id, targetUserId));
        }

        // Update user profile table (create if doesn't exist)
        if (Object.keys(profileUpdates).length > 0) {
          try {
            // Try to update existing profile
            const [existingProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, targetUserId));

            if (existingProfile) {
              await db.update(userProfiles)
                .set(profileUpdates)
                .where(eq(userProfiles.userId, targetUserId));
            } else {
              // Create new profile
              await db.insert(userProfiles).values({
                userId: targetUserId,
                ...profileUpdates
              });
            }
          } catch (error) {
            console.error('Error updating user profile:', error);
            // Continue even if profile update fails
          }
        }

        console.log(`Updated user ${targetUserId}:`, { updates, profileUpdates });
        break;

      case 'updateRole':
        // Legacy role update
        await db.update(users)
          .set({ role: actionData.role })
          .where(eq(users.id, targetUserId));
        break;

      case 'updateCourseAccess':
        // Handle course access updates if needed
        console.log('Course access update not implemented yet');
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});