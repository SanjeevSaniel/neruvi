import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { mem0Service } from '@/lib/mem0-service';

// GET /api/learning-profile - Get user's learning profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await mem0Service.initialize();

    if (!mem0Service.isEnabled()) {
      return NextResponse.json(
        {
          error: 'Memory service not enabled',
          profile: null
        },
        { status: 503 }
      );
    }

    const profile = await mem0Service.getUserLearningProfile(userId);

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error fetching learning profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/learning-profile/update - Update comprehension level
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic, level, struggledWith } = body;

    if (!topic || !level) {
      return NextResponse.json(
        { error: 'Topic and level are required' },
        { status: 400 }
      );
    }

    await mem0Service.initialize();

    if (!mem0Service.isEnabled()) {
      return NextResponse.json(
        { error: 'Memory service not enabled' },
        { status: 503 }
      );
    }

    await mem0Service.updateTopicComprehension(
      userId,
      topic,
      level,
      struggledWith
    );

    return NextResponse.json({
      success: true,
      message: 'Comprehension updated'
    });

  } catch (error) {
    console.error('Error updating comprehension:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/learning-profile - Clear user's learning memory
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await mem0Service.initialize();

    if (!mem0Service.isEnabled()) {
      return NextResponse.json(
        { error: 'Memory service not enabled' },
        { status: 503 }
      );
    }

    await mem0Service.clearUserMemory(userId);

    return NextResponse.json({
      success: true,
      message: 'Learning memory cleared'
    });

  } catch (error) {
    console.error('Error clearing memory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}