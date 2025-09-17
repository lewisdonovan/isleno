import { UserRoleType, UserPermissions, UserProfile } from '@isleno/types/auth'

export interface RouteAccess {
  path: string
  label: string
  icon: any
  requiresAuth: boolean
  allowedRoles: UserRoleType[] 
  requiresSpecialPermission?: (permissions: UserPermissions, profile: UserProfile | null) => boolean
}

export const ROUTE_DEFINITIONS: RouteAccess[] = [
  {
    path: '/',
    label: 'dashboard',
    icon: 'Home',
    requiresAuth: true,
    allowedRoles: ['admin', 'internal', 'department_head', 'default']
  },
  {
    path: '/kpis',
    label: 'kpis', 
    icon: 'BarChart2',
    requiresAuth: true,
    allowedRoles: ['admin', 'internal', 'department_head']
  },
  {
    path: '/invoices',
    label: 'invoices',
    icon: 'FileText',
    requiresAuth: true,
    allowedRoles: ['admin', 'department_head', 'internal', 'default'],
    requiresSpecialPermission: (permissions, profile) => {
      // Users with invoice approval alias have access to their own invoices
      return Boolean(profile?.invoice_approval_alias)
    }
  },
  {
    path: '/admin/user-roles',
    label: 'user_roles',
    icon: 'Users',
    requiresAuth: true,
    allowedRoles: ['admin']
  }
]

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(
  route: RouteAccess,
  role: UserRoleType,
  permissions: UserPermissions,
  profile: UserProfile | null,
  isAuthenticated: boolean
): boolean {
  // Check authentication requirement
  if (route.requiresAuth && !isAuthenticated) {
    return false
  }

  // Check role-based access
  if (!route.allowedRoles.includes(role)) {
    return false
  }

  // Check special permission requirements
  if (route.requiresSpecialPermission && !route.requiresSpecialPermission(permissions, profile)) {
    return false
  }

  return true
}

/**
 * Get filtered navigation items based on user permissions
 */
export function getAccessibleRoutes(
  role: UserRoleType,
  permissions: UserPermissions,
  profile: UserProfile | null,
  isAuthenticated: boolean
): RouteAccess[] {
  return ROUTE_DEFINITIONS.filter(route => 
    hasRouteAccess(route, role, permissions, profile, isAuthenticated)
  )
}

/**
 * Check if user can access a specific department in KPIs
 */
export function canAccessDepartment(
  departmentId: string,
  role: UserRoleType,
  profile: UserProfile | null
): boolean {
  if (role === 'admin') return true
  if (role === 'internal' || role === 'department_head') {
    return profile?.department_id === departmentId
  }
  return false
}

/**
 * Get user's accessible departments for KPIs
 */
export function getAccessibleDepartments(
  role: UserRoleType,
  profile: UserProfile | null,
  allDepartments: Array<{ department_id: string; department_name: string; key: string }>
): Array<{ department_id: string; department_name: string; key: string }> {
  if (role === 'admin') {
    return allDepartments
  }
  
  if ((role === 'internal' || role === 'department_head') && profile?.department_id) {
    return allDepartments.filter(dept => dept.department_id === profile.department_id)
  }
  
  return []
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRoleType): boolean {
  return role === 'admin'
}

/**
 * Check if user is internal staff
 */
export function isInternalUser(role: UserRoleType): boolean {
  return role === 'internal' || role === 'department_head' || role === 'admin'
}

/**
 * Check if user is external
 */
export function isExternalUser(role: UserRoleType): boolean {
  return role === 'external_basic'
}

/**
 * Get user's display role name
 */
export function getRoleDisplayName(role: UserRoleType): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'internal':
      return 'Internal User'
    case 'department_head':
      return 'Department Head'
    case 'external_basic':
      return 'External User'
    case 'default':
    default:
      return 'User'
  }
} 