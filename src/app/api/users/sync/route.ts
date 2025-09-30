import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// POST /api/users/sync - Sync user data from Clerk to database and return user profile
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 User sync request received');

    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      console.log('❌ Database not enabled for sync');
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
        { status: 503 }
      );
    }

    // Get request body with client-side user data
    const body = await request.json();
    const { clerkUserId, email, displayName } = body;

    console.log('📋 Sync request data:', { clerkUserId, email, displayName });

    // Validate required fields
    if (!clerkUserId || !email) {
      console.log('❌ Missing required sync data');
      return NextResponse.json(
        { error: 'clerkUserId and email are required' },
        { status: 400 }
      );
    }

    // Server-side verification (optional but recommended)
    const { userId: serverUserId } = await auth();
    if (serverUserId && serverUserId !== clerkUserId) {
      console.log('❌ User ID mismatch between client and server');
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const dbService = new DatabaseService();

    console.log('🔍 Looking for user in database...');
    // Get or create user in database
    let user = await dbService.getUserByClerkId(clerkUserId);

    if (!user) {
      console.log('👤 User not found, creating new user...');
      // Create user from client data
      user = await dbService.createOrUpdateUser(
        clerkUserId,
        email,
        displayName || ''
      );
      console.log('✅ User created:', user.id);
    } else {
      console.log('👤 User found in database:', user.id);
    }

    // Get usage stats
    const usage = await dbService.getUserUsage(user.id);

    // Get conversation count
    const { total: totalConversations } = await dbService.getUserConversations(user.id, { limit: 1 });

    const responseData = {
      success: true,
      data: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        displayName: user.displayName,
        role: user.role, // Include the user's role
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        usage: usage ? {
          messageCount: usage.messageCount,
          limit: usage.limit,
          resetTime: usage.resetTime,
          remaining: Math.max(0, usage.limit - usage.messageCount)
        } : {
          messageCount: 0,
          limit: 15,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          remaining: 15
        },
        stats: {
          totalConversations
        }
      }
    };

    console.log('✅ User sync completed successfully. Returning data:', {
      userId: user.id,
      role: user.role,
      email: user.email,
      hasRole: !!user.role
    });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error syncing user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}