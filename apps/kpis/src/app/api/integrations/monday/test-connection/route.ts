import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import { mondayRequest } from '@/lib/auth';

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

    // Test Monday.com connection with a simple query
    const token = mondayToken;
    const testQuery = `
      query {
        me {
          id
          name
          email
        }
      }
    `;

    try {
      const data = await mondayRequest<{ me: any }>(
        token,
        testQuery,
        undefined,
        user.id
      );
      
      return NextResponse.json({
        success: true,
        user: data.me,
        message: 'Monday.com connection successful'
      });
    } catch (error) {
      console.error('Monday.com connection test failed:', error);
      return NextResponse.json(
        { 
          error: 'Monday.com connection failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing Monday.com connection:', error);
    return NextResponse.json(
      { error: 'Failed to test Monday.com connection' },
      { status: 500 }
    );
  }
} 