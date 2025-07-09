"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Shield, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleMondayLogin = () => {
    const loginUrl = new URL('/api/auth/monday/login', window.location.origin);
    if (redirect) {
      loginUrl.searchParams.set('redirect', redirect);
    }
    window.location.href = loginUrl.toString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Isleno KPI UI</CardTitle>
            <CardDescription>
              Connect your Monday.com account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure OAuth authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Access your Monday.com boards</span>
              </div>
            </div>
            
            <Button 
              onClick={handleMondayLogin}
              className="w-full"
              size="lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Continue with Monday.com
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Isleno KPI UI</CardTitle>
            <CardDescription>
              Connect your Monday.com account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure OAuth authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Access your Monday.com boards</span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              size="lg"
              disabled
            >
              <Calendar className="mr-2 h-5 w-5" />
              Loading...
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
} 