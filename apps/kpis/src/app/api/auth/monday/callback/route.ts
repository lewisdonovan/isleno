import { NextRequest, NextResponse } from 'next/server';
import { OAuthTokenResponse, UserSession, MondayUser } from '@/types/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/auth/error?error=' + encodeURIComponent(error), request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_code_or_state', request.url));
    }

    // Check environment variables
    const clientId = process.env.MONDAY_CLIENT_ID;
    const clientSecret = process.env.MONDAY_CLIENT_SECRET;
    const redirectUri = process.env.MONDAY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_config', request.url));
    }

    // Verify state from cookie
    const stateCookie = request.cookies.get('oauth_state');
    if (!stateCookie) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid_state', request.url));
    }

    let storedState: { state: string; timestamp: number; redirect?: string };
    try {
      storedState = JSON.parse(stateCookie.value);
    } catch (parseError) {
      console.error('Failed to parse oauth_state cookie:', parseError);
      return NextResponse.redirect(new URL('/auth/error?error=invalid_state_format', request.url));
    }
    
    // Check if state matches and is not expired (10 minutes)
    if (storedState.state !== state || Date.now() - storedState.timestamp > 600000) {
      return NextResponse.redirect(new URL('/auth/error?error=state_mismatch_or_expired', request.url));
    }

    // Exchange code for access token
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://auth.monday.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
    }

    const tokenData: OAuthTokenResponse = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': tokenData.access_token,
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              name
              email
              photo_thumb
              photo_thumb_small
              photo_original
            }
          }
        `,
      }),
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/auth/error?error=user_fetch_failed', request.url));
    }

    const userData = await userResponse.json();

    if (!userData.data?.me) {
      return NextResponse.redirect(new URL('/auth/error?error=no_user_data', request.url));
    }

    const user: MondayUser = userData.data.me;

    // Create session with fallback for expires_in
    const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour if not provided
    const session: UserSession = {
      accessToken: tokenData.access_token,
      userId: user.id,
      accountId: user.id,
      expiresAt: Date.now() + (expiresIn * 1000),
    };

    // Determine redirect destination
    const redirectPath = storedState.redirect && storedState.redirect !== '/' ? storedState.redirect : '/kpis';
    
    // Validate redirect path to prevent open redirects
    const isValidRedirect = redirectPath.startsWith('/') && !redirectPath.startsWith('//');
    const finalRedirectPath = isValidRedirect ? redirectPath : '/kpis';

    // Redirect to original destination or dashboard
    const response = NextResponse.redirect(new URL(finalRedirectPath, request.url));
    
    // Set session cookie
    response.cookies.set('monday_session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
} 