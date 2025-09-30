import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// TEMPORARY endpoint to set up admin user for testing
// This should be removed in production
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled' },
        { status: 503 }
      );
    }

    const userOrResponse = await requireAuth();
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }

    const user = userOrResponse;

    const dbService = new DatabaseService();

    // Check current user count and admin status
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }

    // Import drizzle and schema
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { neon } = await import('@neondatabase/serverless');
    const { users } = await import('@/lib/db/schema');
    const { eq, count, sql: sqlQuery } = await import('drizzle-orm');

    const sql = neon(connectionString);
    const db = drizzle(sql);

    // Get current user count and admin count
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [adminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));

    // Get current user's info
    const [currentUserFromDb] = await db.select().from(users).where(eq(users.clerkId, user.clerkId));

    console.log(`📊 Database Stats:`, {
      totalUsers: totalUsers.count,
      adminUsers: adminCount.count,
      currentUser: {
        email: user.email,
        currentRole: currentUserFromDb?.role || 'not found',
        isActive: currentUserFromDb?.isActive || false
      }
    });

    // Check if user is already admin
    if (currentUserFromDb?.role === 'admin') {
      return NextResponse.json({
        success: true,
        message: 'User already has admin role',
        data: {
          totalUsers: totalUsers.count,
          adminUsers: adminCount.count,
          currentUser: {
            email: user.email,
            role: currentUserFromDb.role,
            isActive: currentUserFromDb.isActive
          }
        }
      });
    }

    // Update user role to admin
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.clerkId, user.clerkId));

    console.log(`🔑 ADMIN SETUP: User ${user.email} has been granted admin role`);

    // Get updated user count and admin count
    const [newAdminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));

    return NextResponse.json({
      success: true,
      message: 'Admin role granted successfully',
      data: {
        totalUsers: totalUsers.count,
        adminUsers: newAdminCount.count,
        currentUser: {
          email: user.email,
          role: 'admin',
          isActive: true
        }
      }
    });

  } catch (error) {
    console.error('Error setting up admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}