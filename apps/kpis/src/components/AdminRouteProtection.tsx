/**
 * Admin Route Protection Component
 * 
 * Protects routes that require admin access.
 * Redirects non-admin users and shows loading state.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

interface AdminRouteProtectionProps {
  children: React.ReactNode
}

export function AdminRouteProtection({ children }: AdminRouteProtectionProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/permissions/admin-status')
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login')
            return
          }
          throw new Error('Failed to check admin status')
        }

        const data = await response.json()
        setIsAdmin(data.isAdmin)
        
        if (!data.isAdmin) {
          router.push('/')
          return
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Checking admin access...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isAdmin === false) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              This page requires admin privileges. You have been redirected.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
