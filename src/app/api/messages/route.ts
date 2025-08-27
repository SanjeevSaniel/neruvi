import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/lib/db/database-service';
import { isDatabaseEnabled } from '@/lib/db/connection';

// GET /api/messages?conversationId=xxx - Get messages for a conversation
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
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get messages
    const messages = await dbService.getConversationMessages(conversationId, {
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: messages,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        selectedCourse: conversation.selectedCourse,
        messageCount: conversation.messageCount
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Add a message to conversation
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
    const { conversationId, role, content, sources, processingTimeMs } = body;

    // Validate input
    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user or assistant' },
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

    // Create message object
    const message = {
      id: Date.now().toString(), // Will be replaced by database ID
      role: role as 'user' | 'assistant',
      content,
      sources: sources || [],
      timestamp: new Date(),
    };

    // Add message to database
    const messageId = await dbService.addMessage(
      conversationId,
      message,
      processingTimeMs
    );

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        message: {
          ...message,
          id: messageId
        }
      }
    });

  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}