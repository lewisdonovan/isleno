import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import { fetchPaActivities } from '@/lib/monday/services';

export async function GET(request: NextRequest) {
  try {
    // Validate Supabase session
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    // Get Monday token for this user
    const mondayToken = await getMondayToken(user.id);
    if (!mondayToken) {
      return NextResponse.json(
        { error: 'No Monday.com token available' },
        { status: 401 }
      );
    }

    // Create a session-like object for the service function
        const sessionLike = {
        user: {
            id: user.id || '',
            email: user.email
        },
        accessToken: `Bearer ${mondayToken}`
    };

    const items = await fetchPaActivities(sessionLike);

    return NextResponse.json({ data: { items } });
  } catch (error) {
    console.error('Error fetching PA activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PA activities: ' + error },
      { status: 500 }
    );
  }
}
