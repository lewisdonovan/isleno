"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Shield, Zap } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { supabaseClient } from '@isleno/supabase'
import { useTranslations } from 'next-intl'

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('auth');

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.VERCEL_PROJECT_PRODUCTION_URL 
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}` 
            : 'http://localhost:3000'}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        // Handle error - you might want to show a toast or error message
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('welcome')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{t('secureOAuth')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>{t('accessDashboard')}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGoogleLogin}
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              <Calendar className="mr-2 h-5 w-5" />
              {isLoading ? t('signingIn') : t('continueWithGoogle')}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              {t('termsAgreement')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoginLoading() {
  const t = useTranslations('auth');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('welcome')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{t('secureOAuth')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>{t('accessDashboard')}</span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              size="lg"
              disabled
            >
              <Calendar className="mr-2 h-5 w-5" />
              {t('loading')}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              {t('termsAgreement')}
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