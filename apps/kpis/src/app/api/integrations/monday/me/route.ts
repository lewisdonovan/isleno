import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken, mondayRequest } from '@/lib/auth';

export async function GET(_request: NextRequest) {
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

    // Fetch current user from Monday
    const query = `
      query {
        me {
          id
          name
          email
          photo_thumb
          photo_thumb_small
          photo_original
          is_guest
          enabled
        }
      }
    `;

    try {
      const data = await mondayRequest(mondayToken, query, undefined, user.id);
      return NextResponse.json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === 'MONDAY_TOKEN_EXPIRED') {
        return NextResponse.json(
          { error: 'MONDAY_TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
} 