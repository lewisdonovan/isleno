import { useState, useEffect } from 'react'
import { clientMaintenanceService, MaintenanceInfo } from '@/lib/services/maintenance'

export interface UseMaintenanceReturn {
  isMaintenanceActive: boolean
  maintenanceInfo: MaintenanceInfo | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook for checking maintenance status
 */
export function useMaintenance(): UseMaintenanceReturn {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false)
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkMaintenanceStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const active = await clientMaintenanceService.isMaintenanceActive()
      setIsMaintenanceActive(active)
      
      if (active) {
        const info = await clientMaintenanceService.getCurrentMaintenance()
        setMaintenanceInfo(info)
      } else {
        setMaintenanceInfo(null)
      }
    } catch (err) {
      console.error('Error checking maintenance status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkMaintenanceStatus()
  }, [])

  return {
    isMaintenanceActive,
    maintenanceInfo,
    loading,
    error,
    refresh: checkMaintenanceStatus
  }
}

/**
 * Hook for checking if maintenance is active (simplified version)
 */
export function useMaintenanceStatus(): boolean {
  const { isMaintenanceActive } = useMaintenance()
  return isMaintenanceActive
}
