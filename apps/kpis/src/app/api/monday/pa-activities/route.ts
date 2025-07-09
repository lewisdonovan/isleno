import { NextRequest, NextResponse } from 'next/server';

import { validateSession } from '@/lib/auth';
import { fetchPaActivities } from '@/lib/monday/services';

export async function GET(request: NextRequest) {
  try {
    const authResult = validateSession(request);
    /*if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }*/

    const items = await fetchPaActivities(authResult.session!);

    return NextResponse.json({ data: { items } });
  } catch (error) {
    console.error('Error fetching PA activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PA activities: ' + error },
      { status: 500 }
    );
  }
}
