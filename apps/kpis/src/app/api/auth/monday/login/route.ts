import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get('redirect');
    
    const clientId = process.env.MONDAY_CLIENT_ID;
    const redirectUri = process.env.MONDAY_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'OAuth configuration missing' },
        { status: 500 }
      );
    }

    // Generate a random state for security
    const state = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();

    // Store state and redirect path in cookies for verification
    const response = NextResponse.redirect(
      `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`
    );

    // Set state cookie with redirect path
    response.cookies.set('oauth_state', JSON.stringify({ state, timestamp, redirect }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
} 