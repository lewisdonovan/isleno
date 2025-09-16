'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Mail } from 'lucide-react'
import { supabaseClient } from '@/lib/supabaseClient'

interface MaintenanceInfo {
  id: string
  start_time: string
  end_time: string
  reason: string | null
  created_by: string | null
}

export default function MaintenancePage() {
  const t = useTranslations('maintenance');
  const tc = useTranslations('common');
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaintenanceInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabaseClient.rpc('get_current_maintenance')
      
      if (fetchError) {
        throw new Error(fetchError.message)
      }
      
      if (data && data.length > 0) {
        setMaintenanceInfo(data[0])
      } else {
        // No active maintenance found, redirect to home
        window.location.href = '/'
        return
      }
    } catch (err) {
      console.error('Error fetching maintenance info:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenanceInfo()
  }, [])

  const formatDateTime = (dateTimeString: string) => {
    try {
      // Parse the datetime string and convert to CET
      const date = new Date(dateTimeString)
      
      // Format time in HH:mm format
      const time = date.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      // Format date in DD/MM/YYYY format
      const formattedDate = date.toLocaleDateString('en-GB', {
        timeZone: 'Europe/Madrid',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      return { time, date: formattedDate }
    } catch (error) {
      console.error('Error formatting datetime:', error)
      return { time: '--:--', date: '--/--/----' }
    }
  }

  const handleRefresh = () => {
    fetchMaintenanceInfo()
  }

  const handleRetry = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{t('checkingStatus')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{t('errorCheckingStatus')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('retry')}
              </Button>
              <Button onClick={handleRetry} size="sm">
                {t('refresh')}
              </Button>
            </div>
            <div className="mt-10 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>{tc('report')}:</span>
            </div>
            <a className="flex items-center justify-center space-x-2 text-sm text-gray-500" href={`mailto:${t('contactEmail')}`}>
              <Mail className="h-4 w-4" />
              <span>{t('contactEmail')}</span>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!maintenanceInfo) {
    return null
  }

  const { time, date } = formatDateTime(maintenanceInfo.end_time)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 leading-relaxed">
              {t('message', { time, date })}
            </p>
          </div>
          
          {maintenanceInfo.reason && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {t('reason', { reason: maintenanceInfo.reason })}
              </p>
            </div>
          )}
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              <span>{t('contactEmail')}</span>
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </Button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400">
            {t('timezone')} • {new Date().toLocaleString('en-GB', { 
              timeZone: 'Europe/Madrid',
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
