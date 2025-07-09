import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/types/auth';

// Routes that require authentication
const protectedRoutes = ['/calendar', '/gantt', '/boards', '/charts', '/forms/point-activities'];
// Routes that are public
const publicRoutes = ['/', '/auth/login', '/auth/error'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth')
  );

  // Skip middleware for API routes (except auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('monday_session');
  
  if (!sessionCookie && isProtectedRoute) {
    // Redirect to login with the original path as a query parameter
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // If we have a session cookie, validate it
  if (sessionCookie) {
    try {
      const session: UserSession = JSON.parse(sessionCookie.value);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        // Clear expired session and redirect to login with original path
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('monday_session');
        return response;
      }

      // Session is valid, continue
      return NextResponse.next();
    } catch (error) {
      console.error('Invalid session format:', error);
      // Invalid session, redirect to login with original path
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('monday_session');
      return response;
    }
  }

  // If we reach here, it's a protected route without a session
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 