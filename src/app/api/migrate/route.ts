import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// POST /api/migrate - Import SessionStorage data to database
export async function POST(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Migration not available.' },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionData } = body;

    // Validate input
    if (!sessionData) {
      return NextResponse.json(
        { error: 'sessionData is required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    
    // Ensure user exists in database
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

    console.log(`🔄 Starting migration for user: ${user.email}`);

    // Check if user already has conversations (avoid duplicate imports)
    const { total: existingConversations } = await dbService.getUserConversations(user.id, { limit: 1 });
    
    if (existingConversations > 0) {
      return NextResponse.json({
        success: false,
        error: 'User already has conversations in database. Migration skipped to avoid duplicates.',
        data: {
          existingConversations
        }
      }, { status: 409 });
    }

    // Import the data
    const result = await dbService.importFromSessionStorage(user.id, sessionData);

    console.log(`✅ Migration completed for ${user.email}: ${result.conversationsImported} conversations, ${result.messagesImported} messages`);

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      data: {
        conversationsImported: result.conversationsImported,
        messagesImported: result.messagesImported,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/migrate - Check migration status
export async function GET(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json({
        success: false,
        databaseEnabled: false,
        message: 'Database not enabled. Migration not available.'
      });
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbService = new DatabaseService();
    
    // Check if user exists and has data
    const user = await dbService.getUserByClerkId(userId);
    
    if (!user) {
      return NextResponse.json({
        success: true,
        databaseEnabled: true,
        migrationNeeded: true,
        userExists: false,
        existingConversations: 0
      });
    }

    const { total: existingConversations } = await dbService.getUserConversations(user.id, { limit: 1 });

    return NextResponse.json({
      success: true,
      databaseEnabled: true,
      migrationNeeded: existingConversations === 0,
      userExists: true,
      existingConversations,
      user: {
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}