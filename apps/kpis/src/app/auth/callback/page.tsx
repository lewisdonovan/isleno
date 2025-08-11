"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseClient } from '@isleno/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let redirected = false

    const handleAuthCallback = async () => {
      try {
        // Listen for auth state changes (this is the key for OAuth callbacks)
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session?.user && !redirected) {
            redirected = true
            setRedirecting(true)
            console.log('User authenticated successfully:', session.user)
            
            // Get redirect path from URL params
            const redirect = searchParams.get('redirect')
            const targetPath = redirect || '/'
            
            console.log('Redirecting to:', targetPath)
            
            // Pass session info to help middleware recognize the auth state
            const redirectUrl = new URL(targetPath, process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
            redirectUrl.searchParams.set('fresh_auth', 'true')
            redirectUrl.searchParams.set('user_id', session.user.id)
            
            // Use window.location.href for full page reload to ensure session is available to middleware
            setTimeout(() => {
              window.location.href = redirectUrl.toString()
            }, 1000)
          }
          
          if (event === 'SIGNED_OUT') {
            console.log('User signed out')
            if (!redirected) {
              redirected = true
              router.push('/auth/login')
            }
          }
        })

        // Check for existing session
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError(error.message)
          setTimeout(() => {
            router.push('/auth/login?error=session_error')
          }, 2000)
          return
        }

        // If we already have a session, redirect immediately
        if (session?.user && !redirected) {
          redirected = true
          setRedirecting(true)
          console.log('Existing session found:', session.user.email)
          
          const redirect = searchParams.get('redirect')
          const targetPath = redirect || '/'
          
          // Pass session info to help middleware recognize the auth state
          const redirectUrl = new URL(targetPath, process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
          redirectUrl.searchParams.set('fresh_auth', 'true')
          redirectUrl.searchParams.set('user_id', session.user.id)
          
          setTimeout(() => {
            window.location.href = redirectUrl.toString()
          }, 500)
        }

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Callback handling error:', error)
        setError('Authentication failed')
        setTimeout(() => {
          router.push('/auth/login?error=callback_error')
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-700 mb-2">Authentication Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-500 text-xs mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-teal-700">
          {redirecting ? 'Redirecting to dashboard...' : 'Completing sign in...'}
        </p>
        <p className="text-teal-600 text-sm mt-2">Please wait while we verify your authentication...</p>
      </div>
    </div>
  )
} 