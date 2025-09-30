import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    return NextResponse.json({
      authenticated: !!userId,
      userId: userId || null,
      email: user?.emailAddresses?.[0]?.emailAddress || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to get auth status'
    });
  }
}