'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MaintenanceUtils } from '@/lib/services/maintenance'
import { AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react'

interface MaintenanceManagerProps {
  className?: string
}

export default function MaintenanceManager({ className }: MaintenanceManagerProps) {
  const t = useTranslations('maintenance')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState('60') // minutes
  const [reason, setReason] = useState('')

  const handleCreateMaintenance = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Validate form
      if (!startDate || !startTime || !duration) {
        setError('Please fill in all required fields')
        return
      }

      // Create start time in CET
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const durationMinutes = parseInt(duration)
      
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        setError('Duration must be a positive number')
        return
      }

      const maintenanceRequest = MaintenanceUtils.createMaintenanceWindow(
        startDateTime,
        durationMinutes,
        reason || undefined
      )

      // Validate the maintenance window
      const validation = MaintenanceUtils.validateMaintenanceWindow(maintenanceRequest)
      if (!validation.valid) {
        setError(validation.error || 'Invalid maintenance window')
        return
      }

      // Create maintenance window via API
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create maintenance window')
      }

      setSuccess('Maintenance window created successfully')
      
      // Reset form
      setStartDate('')
      setStartTime('')
      setDuration('60')
      setReason('')
      
    } catch (err) {
      console.error('Error creating maintenance window:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEndMaintenance = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/maintenance', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to end maintenance window')
      }

      setSuccess('Maintenance window ended successfully')
      
    } catch (err) {
      console.error('Error ending maintenance window:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Set default start time to 1 hour from now
  const setDefaultTime = () => {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    const date = oneHourLater.toISOString().split('T')[0]
    const time = oneHourLater.toTimeString().split(' ')[0].substring(0, 5)
    
    setStartDate(date)
    setStartTime(time)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Maintenance Mode Manager</span>
        </CardTitle>
        <CardDescription>
          Schedule maintenance windows to temporarily disable the Isleño Admin UI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (CET)</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Database migration, system updates..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={setDefaultTime} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Set 1 Hour from Now
          </Button>
          <Button onClick={handleCreateMaintenance} disabled={loading}>
            <Calendar className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Schedule Maintenance'}
          </Button>
          <Button onClick={handleEndMaintenance} variant="destructive" disabled={loading}>
            End Current Maintenance
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          <p><strong>Note:</strong> All times are in CET timezone (Europe/Madrid)</p>
          <p>Users will be redirected to a maintenance page during the scheduled window.</p>
        </div>
      </CardContent>
    </Card>
  )
}
