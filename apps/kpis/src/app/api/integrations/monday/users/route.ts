import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import { fetchUsers } from '@/lib/monday/services'

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

    const users = await fetchUsers(sessionLike)
    return NextResponse.json({ data: { users } })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error },
      { status: 500 }
    )
  }
}
