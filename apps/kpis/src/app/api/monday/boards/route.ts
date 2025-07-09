import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { fetchBoards } from '@/lib/monday/services';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const boards = await fetchBoards(authResult.session!, page, limit);
    return NextResponse.json({ data: { boards } });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    );
  }
} 