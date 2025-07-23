import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { decrypt } from '@/lib/encryption';
import type { Database } from '@isleno/types/db/public';

export async function GET() {
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

    const { data: tokenData, error } = await supabase
      .from('user_monday_tokens')
      .select('monday_access_token')
      .eq('user_id', session.user.id)
      .single();

    if (error || !tokenData) {
      return new NextResponse(
        JSON.stringify({ error: 'Monday token not found.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const decryptedToken = decrypt(tokenData.monday_access_token);

    return new NextResponse(JSON.stringify({ token: decryptedToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to retrieve Monday token:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
} 