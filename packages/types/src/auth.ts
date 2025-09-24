export interface UserProfile {
  id: string
  full_name: string | null
  department_id: string | null
  department_name: string | null
  department_key: string | null
  odoo_group_id: number | null
  job_title: string | null
  language: string | null
  location: string | null
  monday_user_id: number | null
  invoice_approval_alias: string | null
  role?: UserRoleType
}

export type UserRoleType = 'default' | 'internal' | 'internal_user' | 'admin' | 'external_basic' | 'department_head' | 'team_leader'

export interface UserPermissions {
  canAccessKpis: boolean
  canAccessDepartment: (departmentId: string) => boolean
  canAccessCalendar: boolean
  canAccessGantt: boolean
  canAccessCashflow: boolean
  canAccessInvoices: boolean
  canAccessCharts: boolean
  canAccessBoards: boolean
  canAccessAllDepartments: boolean
}

export interface EnhancedUser {
  user: any
  session: any
  profile: UserProfile | null
  role: UserRoleType
  permissions: UserPermissions
  isLoading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

// Session context types
export interface SessionContextType {
  user: any | null
  session: any | null
  loading: boolean
  signOut: () => Promise<void>
}

// User session type for Monday API
export interface UserSession {
  user: {
    id: string
    email?: string
  }
  accessToken: string
}

// Monday user type
export interface MondayUser {
  id: number
  name: string
  email: string
  title?: string
  account: {
    id: number
    name: string
  }
}

// Monday linking status type
export interface MondayLinkingStatus {
  isLoading: boolean
  hasToken: boolean
  isEligible: boolean
  error: string | null
  refetch: () => Promise<void>
} 