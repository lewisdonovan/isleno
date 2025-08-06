"use client"

import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { UserRoleType, MondayLinkingStatus } from '@isleno/types/auth'
import { fetchWithTokenExpirationHandling } from '@/lib/utils/mondayTokenUtils'

const ELIGIBLE_ROLES: UserRoleType[] = ['internal', 'admin', 'team_leader']

export function useMondayLinking(): MondayLinkingStatus {
  const { role, isAuthenticated, isLoading: userLoading } = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [hasToken, setHasToken] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEligible = isAuthenticated && ELIGIBLE_ROLES.includes(role)

  const checkTokenStatus = useCallback(async () => {
    if (!isAuthenticated || !isEligible) {
      setIsLoading(false)
      setHasToken(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if user has a valid Monday token by calling the /me endpoint
      const response = await fetchWithTokenExpirationHandling('/api/integrations/monday/me')

      if (response.ok) {
        setHasToken(true)
      } else {
        // No token or invalid token (but not expired, since that's handled by the utility)
        setHasToken(false)
      }
    } catch (err) {
      console.error('Error checking Monday token status:', err)
      if (err instanceof Error && err.message === 'MONDAY_TOKEN_EXPIRED') {
        // Token expired, the utility already handled the redirect
        setHasToken(false)
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setHasToken(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, isEligible])

  useEffect(() => {
    if (!userLoading) {
      checkTokenStatus()
    }
  }, [isAuthenticated, isEligible, userLoading, checkTokenStatus])

  return {
    isLoading,
    hasToken,
    isEligible,
    error,
    refetch: checkTokenStatus
  }
} 