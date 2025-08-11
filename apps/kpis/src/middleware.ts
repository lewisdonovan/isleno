import { createMiddlewareClient } from '@isleno/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Add pathname to headers so the layout can access it
  res.headers.set('x-pathname', req.nextUrl.pathname)
  
  const supabase = createMiddlewareClient({ req, res })
  
  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Allow auth routes regardless of session
  if (pathname.startsWith('/auth/')) {
    return res
  }

  // Protect all other routes
  if (!user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access login, redirect to home
  if (user && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 