import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { encrypt } from '@/lib/encryption';
import type { Database } from '@isleno/types/db/public';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('monday_oauth_state')?.value;

  if (state !== storedState) {
    return NextResponse.redirect(
      new URL('/settings?error=state_mismatch', request.url),
    );
  }

  cookieStore.delete('monday_oauth_state');

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=missing_code', request.url),
    );
  }

  try {
    const tokenResponse = await fetch(
      'https://oauth.monday.com/oauth/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.MONDAY_CLIENT_ID,
          client_secret: process.env.MONDAY_CLIENT_SECRET,
          code,
          redirect_uri: process.env.MONDAY_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to fetch token');
    }

    const { access_token } = tokenData;

    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(
        new URL('/auth/login?error=no_session', request.url),
      );
    }

    const encryptedToken = encrypt(access_token);
    
    const { error } = await supabase.from('user_monday_tokens').upsert(
      {
        user_id: session.user.id,
        monday_access_token: encryptedToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.redirect(
      new URL('/settings?mondayLinked=true', request.url),
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(
        `/settings?error=token_exchange_failed&message=${encodeURIComponent(
          errorMessage,
        )}`,
        request.url,
      ),
    );
  }
} 