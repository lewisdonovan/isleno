import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabaseServer';
import { encrypt } from '@/lib/encryption';

const ELIGIBLE_ROLES = ['internal', 'admin', 'team_leader'];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('monday_oauth_state')?.value;

  if (state !== storedState) {
    return NextResponse.redirect(
      new URL('/?mondayError=state_mismatch', request.url),
    );
  }

  cookieStore.delete('monday_oauth_state');

  if (!code) {
    return NextResponse.redirect(
      new URL('/?mondayError=missing_code', request.url),
    );
  }

  try {
    const tokenResponse = await fetch(
      'https://auth.monday.com/oauth2/token',
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

    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Monday OAuth callback - Auth check:', { 
      hasUser: !!user, 
      authError: authError?.message,
      userId: user?.id 
    });

    if (authError || !user) {
      console.error('Monday OAuth callback - No authenticated user:', authError);
      return NextResponse.redirect(
        new URL('/auth/login?error=no_session', request.url),
      );
    }

    // Check user role eligibility
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Monday OAuth callback - Role check:', { 
      roleData, 
      hasRoles: !!roleData && roleData.length > 0 
    });

    if (!roleData || roleData.length === 0) {
      console.error('Monday OAuth callback - No roles found for user');
      return NextResponse.redirect(
        new URL('/?mondayError=insufficient_permissions', request.url),
      );
    }

    // Check if user has any eligible role
    const hasEligibleRole = roleData.some((userRole: { role: string }) => 
      ELIGIBLE_ROLES.includes(userRole.role)
    );

    console.log('Monday OAuth callback - Role eligibility:', { 
      userRoles: roleData.map(r => r.role), 
      eligibleRoles: ELIGIBLE_ROLES,
      hasEligibleRole 
    });

    if (!hasEligibleRole) {
      console.error('Monday OAuth callback - User has no eligible roles');
      return NextResponse.redirect(
        new URL('/?mondayError=insufficient_permissions', request.url),
      );
    }

    const encryptedToken = encrypt(access_token);
    
    // Delete any existing tokens for this user to avoid accumulation
    const { error: deleteError } = await supabase
      .from('user_monday_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Monday OAuth callback - Token cleanup error:', deleteError);
      // Continue anyway, the upsert will handle it
    }

    // Insert the new token
    const { error } = await supabase.from('user_monday_tokens').insert(
      {
        user_id: user.id,
        monday_access_token: encryptedToken,
        updated_at: new Date().toISOString(),
      }
    );

    if (error) {
      console.error('Monday OAuth callback - Token storage error:', error);
      throw error;
    }

    console.log('Monday OAuth callback - Token stored successfully for user:', user.id);

    return NextResponse.redirect(
      new URL('/?mondayLinked=true', request.url),
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(
        `/?mondayError=token_exchange_failed&message=${encodeURIComponent(
          errorMessage,
        )}`,
        request.url,
      ),
    );
  }
} 