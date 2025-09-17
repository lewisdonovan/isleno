"use client"

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { canAccessDepartment } from '@/lib/rbac'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { UserRoleType } from '@isleno/types/auth'

interface RouteProtectionProps {
  children: React.ReactNode
  requiredRole?: Array<UserRoleType>
  departmentId?: string
  fallbackRoute?: string
}

export function RouteProtection({ 
  children, 
  requiredRole = [], 
  departmentId,
  fallbackRoute = '/' 
}: RouteProtectionProps) {
  const { role, profile, isLoading, isAuthenticated } = useCurrentUser()
  const router = useRouter()
  const t = useTranslations('errors')

  useEffect(() => {
    if (isLoading) return

    // Check authentication
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // Check role requirements
    if (requiredRole.length > 0 && !requiredRole.includes(role)) {
      router.push(fallbackRoute)
      return
    }

    // Check department access for KPIs
    if (departmentId && !canAccessDepartment(departmentId, role, profile)) {
      router.push('/kpis') // Redirect to general KPIs page
      return
    }
  }, [isLoading, isAuthenticated, role, profile, departmentId, requiredRole, router, fallbackRoute])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (requiredRole.length > 0 && !requiredRole.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('accessDenied')}
          </h1>
          <p className="text-gray-600 mb-4">
            {t('insufficientPermissions')}
          </p>
          <button 
            onClick={() => router.push(fallbackRoute)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    )
  }

  if (departmentId && !canAccessDepartment(departmentId, role, profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('departmentAccessDenied')}
          </h1>
          <p className="text-gray-600 mb-4">
            {t('noDepartmentPermissions')}
          </p>
          <button 
            onClick={() => router.push('/kpis')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('backToKpis')}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface DepartmentProtectedRouteProps {
  children: React.ReactNode
  departmentId: string
}

export function DepartmentProtectedRoute({ children, departmentId }: DepartmentProtectedRouteProps) {
  return (
    <RouteProtection 
      requiredRole={['admin', 'internal', 'team_leader']} 
      departmentId={departmentId}
      fallbackRoute="/kpis"
    >
      {children}
    </RouteProtection>
  )
} 