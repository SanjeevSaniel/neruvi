import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const course = searchParams.get('course') as 'nodejs' | 'python' | null;

    const dbService = new DatabaseService();
    
    // Get or create user in database
    let user = await dbService.getUserByClerkId(userId);
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json(
          { error: 'Unable to get user information' },
          { status: 401 }
        );
      }
      
      // Create user from Clerk data
      user = await dbService.createOrUpdateUser(
        userId,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || ''
      );
      
      console.log(`👤 Auto-created user during conversation fetch: ${user.email}`);
    }

    const result = await dbService.getUserConversations(user.id, {
      limit,
      offset,
      course: course || undefined
    });

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        limit,
        offset,
        total: result.total,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
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

    const body = await request.json();
    const { title, selectedCourse } = body;

    // Validate input
    if (!title || !selectedCourse) {
      return NextResponse.json(
        { error: 'Title and selectedCourse are required' },
        { status: 400 }
      );
    }

    if (!['nodejs', 'python'].includes(selectedCourse)) {
      return NextResponse.json(
        { error: 'Invalid course. Must be nodejs or python' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    
    // Get or create user in database
    let user = await dbService.getUserByClerkId(userId);
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json(
          { error: 'Unable to get user information' },
          { status: 401 }
        );
      }
      
      // Create user from Clerk data
      user = await dbService.createOrUpdateUser(
        userId,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.username || ''
      );
      
      console.log(`👤 Auto-created user during conversation creation: ${user.email}`);
    }

    const conversation = await dbService.createConversation(
      user.id,
      title,
      selectedCourse
    );

    return NextResponse.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations - Update conversation (e.g., title)
export async function PUT(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
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

    const body = await request.json();
    const { conversationId, title } = body;

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    
    // Get user
    const user = await dbService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify conversation ownership
    const conversation = await dbService.getConversationById(conversationId, user.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update the conversation
    const updatedConversation = await dbService.updateConversation(conversationId, {
      title: title || conversation.title
    });

    return NextResponse.json({
      success: true,
      data: updatedConversation
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    // Check if database is enabled
    if (!isDatabaseEnabled()) {
      return NextResponse.json(
        { error: 'Database not enabled. Using SessionStorage.' },
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

    const body = await request.json();
    const { conversationId } = body;

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();

    // Get user
    const user = await dbService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify conversation ownership
    const conversation = await dbService.getConversationById(conversationId, user.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete the conversation
    await dbService.deleteConversation(conversationId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}