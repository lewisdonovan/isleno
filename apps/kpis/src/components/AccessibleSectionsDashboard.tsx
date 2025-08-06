"use client"

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getAccessibleRoutes } from '@/lib/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  BarChart2, 
  BarChart3, 
  Calendar, 
  GanttChartSquare, 
  DollarSign, 
  FileText,
  Mail,
  Shield,
  AlertCircle, 
  Settings2
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getRoleDisplayName } from '@/lib/rbac'
import { MondayLinkingCard } from '@/components/MondayLinkingCard'
import { useMondayLinking } from '@/hooks/useMondayLinking'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { OAuthService } from '@/lib/services/oauthService'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { NAVIGATION_ICON_MAP, SECTION_DESCRIPTIONS } from '@/configs';

export function AccessibleSectionsDashboard() {
  const { role, permissions, profile, isLoading, isAuthenticated } = useCurrentUser()
  const { refetch: refetchMondayStatus } = useMondayLinking()
  const t = useTranslations('dashboard')
  const tNavigation = useTranslations('navigation')
  const tMonday = useTranslations('monday')

  // Handle OAuth callback results
  useEffect(() => {
    const result = OAuthService.processOAuthCallback()
    
    if (result?.success) {
      toast.success(tMonday('linkSuccessTitle'), {
        description: tMonday('linkSuccessDescription'),
      })
      // Refresh Monday status to hide the card
      refetchMondayStatus()
      OAuthService.cleanupUrl()
    } else if (result?.error) {
      let errorTitle = tMonday('linkErrorTitle')
      let errorDescription = tMonday('linkErrorDescription', { 
        error: result.message || 'Unknown error'
      })

      // Handle specific error types
      switch (result.errorType) {
        case 'insufficient_permissions':
          errorTitle = tMonday('permissionErrorTitle')
          errorDescription = tMonday('permissionErrorDescription')
          break
        case 'state_mismatch':
          errorDescription = tMonday('stateMismatchError')
          break
        case 'missing_code':
          errorDescription = tMonday('missingCodeError')
          break
        case 'token_exchange_failed':
          errorDescription = tMonday('tokenExchangeError')
          break
      }

      toast.error(errorTitle, {
        description: errorDescription,
      })
      OAuthService.cleanupUrl()
    }
  }, [refetchMondayStatus, tMonday])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Get accessible routes based on user permissions
  const accessibleRoutes = getAccessibleRoutes(role, permissions, profile, isAuthenticated)
  
  // Filter out the dashboard itself to avoid recursion
  const sectionsToShow = accessibleRoutes.filter(route => route.path !== '/')

  // Replace the iconMap with NAVIGATION_ICON_MAP and use SECTION_DESCRIPTIONS for getSectionDescription function
  const getSectionDescription = (path: string, label: string) => {
    return SECTION_DESCRIPTIONS[path] || `Access ${label} features and tools.`;
  };

  if (sectionsToShow.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('welcome')}
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{getRoleDisplayName(role)}</Badge>
            </div>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span>{t('noAccessTitle')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('noAccessMessage')}
              </p>
              <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('contactIT')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings2 className="h-5 w-5" />
              <span>{t('welcome')}</span>
            </CardTitle>
            <CardDescription>
              {t('accessLevel')}: <Badge variant="secondary">{getRoleDisplayName(role)}</Badge>
              {profile?.department_name && (
                <span className="ml-2">
                  {t('department')}: <Badge variant="outline">{profile.department_name}</Badge>
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Monday.com Integration Card - only show if not linked */}
        <MondayLinkingCard />

        {/* Accessible Sections */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('availableSections')}</h2>
          
          {sectionsToShow.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sectionsToShow.map((section) => {
                const IconComponent = NAVIGATION_ICON_MAP[section.icon as keyof typeof NAVIGATION_ICON_MAP] || AlertCircle
                
                return (
                  <SectionCard
                    key={section.path}
                    title={tNavigation(section.label)}
                    description={getSectionDescription(section.path, tNavigation(section.label))}
                    path={section.path}
                    icon={IconComponent}
                  />
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-center">{t('noAccessibleSections')}</p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {t('contactAdministrator')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 