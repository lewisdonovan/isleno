import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { fetchCurrentUser } from '@/lib/monday/services';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const authResult = validateSession(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const user = await fetchCurrentUser(authResult.session!);
    return NextResponse.json({ data: { me: user } });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
} 