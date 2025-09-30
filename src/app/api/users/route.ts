import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// GET /api/users - Get current user profile and usage stats
export async function GET(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      console.log('❌ Database not enabled');
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
        { status: 503 }
      );
    }

    console.log('🔍 Checking Clerk authentication...');
    const { userId } = await auth();
    const clerkUser = await currentUser();

    console.log('🔍 Auth check results:', {
      hasUserId: !!userId,
      userId: userId,
      hasClerkUser: !!clerkUser,
      userEmail: clerkUser?.emailAddresses?.[0]?.emailAddress
    });

    if (!userId || !clerkUser) {
      console.log('❌ Authentication failed - no userId or clerkUser');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbService = new DatabaseService();
    
    // Get or create user in database
    let user = await dbService.getUserByClerkId(userId);
    
    if (!user) {
      // Create user from Clerk data
      user = await dbService.createOrUpdateUser(
        userId,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || ''
      );
    }

    // Get usage stats
    const usage = await dbService.getUserUsage(user.id);
    
    // Get conversation count
    const { total: totalConversations } = await dbService.getUserConversations(user.id, { limit: 1 });

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create or update user (usually called from Clerk webhook)
export async function POST(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { clerkId, email, displayName } = body;

    // Validate input
    if (!clerkId || !email) {
      return NextResponse.json(
        { error: 'clerkId and email are required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    
    const user = await dbService.createOrUpdateUser(
      clerkId,
      email,
      displayName
    );

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}