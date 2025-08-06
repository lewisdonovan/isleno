import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabaseServer';

const ELIGIBLE_ROLES = ['internal', 'admin', 'team_leader'];

export async function GET(request: NextRequest) {
  try {
    // Check user authentication and role eligibility
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth/login?error=unauthorized', request.url)
      );
    }

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roleData || roleData.length === 0) {
      return NextResponse.redirect(
        new URL('/?mondayError=insufficient_permissions', request.url)
      );
    }

    // Check if user has any eligible role
    const hasEligibleRole = roleData.some(userRole => 
      ELIGIBLE_ROLES.includes(userRole.role)
    );

    if (!hasEligibleRole) {
      return NextResponse.redirect(
        new URL('/?mondayError=insufficient_permissions', request.url)
      );
    }

    // Generate OAuth state for security
    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set('monday_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    // Build OAuth URL
    const clientId = process.env.MONDAY_CLIENT_ID;
    const redirectUri = process.env.MONDAY_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.error('Monday OAuth not configured properly');
      return NextResponse.redirect(
        new URL('/?mondayError=configuration_error', request.url)
      );
    }

    const authUrl = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Monday OAuth:', error);
    return NextResponse.redirect(
      new URL('/?mondayError=initiation_failed', request.url)
    );
  }
} 