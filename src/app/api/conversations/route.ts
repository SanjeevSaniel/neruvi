import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
    
    // Ensure user exists in database
    const user = await dbService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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
    
    // Get or create user
    let user = await dbService.getUserByClerkId(userId);
    if (!user) {
      // This shouldn't happen if user is authenticated, but let's handle it
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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