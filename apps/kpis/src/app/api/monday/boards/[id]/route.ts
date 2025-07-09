import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { fetchBoardDetails } from '@/lib/monday/services';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate session
    const authResult = validateSession(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const { id } = await params;
    const board = await fetchBoardDetails(authResult.session!, id);
    return NextResponse.json({ data: { boards: [board] } });
  } catch (error) {
    console.error('Error fetching board details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board details' },
      { status: 500 }
    );
  }
} 