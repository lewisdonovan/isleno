import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import { fetchPropertyDatabaseRenovation } from '@/lib/monday/services';

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
    
    try {
      console.log('Fetching property database renovation data...');
      const data = await fetchPropertyDatabaseRenovation(sessionLike);
      console.log('Successfully fetched property database renovation data:', {
        boards: data.boards?.length,
        groups: data.boards?.[0]?.groups?.length,
        items: data.boards?.[0]?.groups?.[0]?.items_page?.items?.length
      });
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error in property database renovation API:', error);
      if (error instanceof Error && error.message === 'MONDAY_TOKEN_EXPIRED') {
        return NextResponse.json(
          { error: 'MONDAY_TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching property database renovation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property database renovation data' },
      { status: 500 }
    );
  }
} 