"use client"

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'Access was denied. Please try again and grant the necessary permissions.'
      case 'invalid_state':
        return 'Invalid authentication state. Please try logging in again.'
      case 'state_mismatch_or_expired':
        return 'Authentication session expired. Please try logging in again.'
      case 'token_exchange_failed':
        return 'Failed to complete authentication. Please try again.'
      case 'user_fetch_failed':
        return 'Failed to retrieve user information. Please try again.'
      case 'callback_failed':
        return 'Authentication callback failed. Please try again.'
      case 'missing_code_or_state':
        return 'Missing authentication parameters. Please try logging in again.'
      case 'missing_config':
        return 'Application configuration is missing. Please contact support.'
      case 'invalid_state_format':
        return 'Authentication state is corrupted. Please try logging in again.'
      case 'no_user_data':
        return 'Failed to retrieve user profile. Please try again.'
      default:
        return 'An unexpected error occurred during authentication. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Error code: {error || 'unknown'}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
              <CardDescription>
                Loading error details...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 