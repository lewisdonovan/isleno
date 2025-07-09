import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/types/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('monday_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const session: UserSession = JSON.parse(sessionCookie.value);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        return NextResponse.json({ authenticated: false });
      }

      return NextResponse.json({ 
        authenticated: true,
        userId: session.userId
      });
    } catch (error) {
      console.error('Session parsing error:', error);
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ authenticated: false });
  }
} 