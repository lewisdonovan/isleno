"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link as LinkIcon, Calendar, Shield, Loader2 } from 'lucide-react'
import { useMondayLinking } from '@/hooks/useMondayLinking'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export function MondayLinkingCard() {
  const { isLoading, hasToken, isEligible } = useMondayLinking()
  const t = useTranslations('monday')

  // Don't show the card if user is not eligible or already has a token
  if (!isEligible || hasToken || isLoading) {
    return null
  }

  const handleLinkAccount = () => {
    try {
      // Use server-side OAuth initiation for better security and role checking
      window.location.href = '/api/auth/monday/login'
    } catch (error) {
      console.error('Error initiating Monday OAuth:', error)
      toast.error(t('linkErrorTitle'), {
        description: t('linkErrorDescription', { error: 'Failed to initiate OAuth flow' }),
      })
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span>{t('linkAccountTitle')}</span>
            <Badge variant="secondary" className="ml-2">{t('required')}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-base">
          {t('linkAccountDescription')}
        </CardDescription>
        
        <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('featuresTitle')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('featuresDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="h-4 w-4" />
            <span>{t('secureConnection')}</span>
          </div>
          <Button 
            onClick={handleLinkAccount}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('connecting')}
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                {t('connectAccount')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 