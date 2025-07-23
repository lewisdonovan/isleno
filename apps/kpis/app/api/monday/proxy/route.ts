import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { decrypt } from '@/lib/encryption';
import type { Database } from '@isleno/types/db/public';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('user_monday_tokens')
      .select('monday_access_token')
      .eq('user_id', session.user.id)
      .single();

    if (tokenError || !tokenData) {
      return new NextResponse(
        JSON.stringify({ error: 'Monday token not found.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const decryptedToken = decrypt(tokenData.monday_access_token);
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return new NextResponse(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedToken}`,
      },
      body: JSON.stringify({ query }),
    });

    const mondayData = await mondayResponse.json();

    if (!mondayResponse.ok) {
      console.error('Monday API Error:', mondayData);
      return new NextResponse(JSON.stringify(mondayData), {
        status: mondayResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify(mondayData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
} 