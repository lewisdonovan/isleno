/**
 * React Hooks for Permission Management
 * 
 * This file provides React hooks for managing permissions in client components.
 * These hooks integrate with the permission service and provide reactive state management.
 */

import { useState, useEffect, useCallback } from 'react'
import { clientPermissionService, PermissionContext } from '@/lib/services/permissions'

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permissionName: string, context: PermissionContext = {}) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkPermission = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await clientPermissionService.userHasPermission(permissionName, context)
      setHasPermission(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }, [permissionName, context])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    hasPermission,
    loading,
    error,
    refetch: checkPermission
  }
}

/**
 * Hook to check if current user can access department-level resources
 */
export function useDepartmentAccess(
  departmentId: string,
  resourceType: string,
  action: string
) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAccess = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the department access API endpoint
      const response = await fetch('/api/permissions/department-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_id: departmentId,
          resource_type: resourceType,
          action: action
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check department access')
      }

      const data = await response.json()
      setHasAccess(data.hasAccess)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }, [departmentId, resourceType, action])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  return {
    hasAccess,
    loading,
    error,
    refetch: checkAccess
  }
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await clientPermissionService.getUserPermissions()
      setPermissions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions
  }
}

/**
 * Hook to get all available permissions
 */
export function useAllPermissions() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await clientPermissionService.getAllPermissions()
      setPermissions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions
  }
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(permissionNames: string[], context: PermissionContext = {}) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await Promise.all(
        permissionNames.map(async (permissionName) => {
          const hasPermission = await clientPermissionService.userHasPermission(permissionName, context)
          return { permissionName, hasPermission }
        })
      )

      const permissionMap = results.reduce((acc, { permissionName, hasPermission }) => {
        acc[permissionName] = hasPermission
        return acc
      }, {} as Record<string, boolean>)

      setPermissions(permissionMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPermissions({})
    } finally {
      setLoading(false)
    }
  }, [permissionNames, context])

  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  return {
    permissions,
    loading,
    error,
    refetch: checkPermissions
  }
}

/**
 * Hook to check if user has any permission for a resource
 */
export function useResourcePermissions(resource: string, context: PermissionContext = {}) {
  const commonPermissions = [
    `${resource}.view`,
    `${resource}.create`,
    `${resource}.edit`,
    `${resource}.delete`
  ]

  const { permissions, loading, error, refetch } = usePermissions(commonPermissions, context)

  const hasAnyPermission = Object.values(permissions).some(Boolean)
  const hasViewPermission = permissions[`${resource}.view`] || false
  const hasCreatePermission = permissions[`${resource}.create`] || false
  const hasEditPermission = permissions[`${resource}.edit`] || false
  const hasDeletePermission = permissions[`${resource}.delete`] || false

  return {
    hasAnyPermission,
    hasViewPermission,
    hasCreatePermission,
    hasEditPermission,
    hasDeletePermission,
    permissions,
    loading,
    error,
    refetch
  }
}

/**
 * Hook for permission-based conditional rendering
 */
export function usePermissionGate(permissionName: string, context: PermissionContext = {}) {
  const { hasPermission, loading, error } = usePermission(permissionName, context)

  return {
    canAccess: hasPermission === true,
    loading,
    error,
    hasPermission
  }
}

/**
 * Hook for multiple permission gates
 */
export function usePermissionGates(permissionNames: string[], context: PermissionContext = {}) {
  const { permissions, loading, error } = usePermissions(permissionNames, context)

  const gates = permissionNames.reduce((acc, permissionName) => {
    acc[permissionName] = {
      canAccess: permissions[permissionName] === true,
      hasPermission: permissions[permissionName]
    }
    return acc
  }, {} as Record<string, { canAccess: boolean; hasPermission: boolean }>)

  return {
    gates,
    loading,
    error,
    permissions
  }
}

/**
 * Hook to check if current user is admin (has full system access)
 */
export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAdminStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/permissions/admin-status', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to check admin status')
      }

      const data = await response.json()
      setIsAdmin(data.isAdmin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  return {
    isAdmin,
    loading,
    error,
    refetch: checkAdminStatus
  }
}

/**
 * Hook to get all admin users
 */
export function useAdminUsers() {
  const [adminUsers, setAdminUsers] = useState<Array<{ user_id: string; full_name: string; email: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/permissions/admin-users', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch admin users')
      }

      const data = await response.json()
      setAdminUsers(data.adminUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAdminUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdminUsers()
  }, [fetchAdminUsers])

  return {
    adminUsers,
    loading,
    error,
    refetch: fetchAdminUsers
  }
}
