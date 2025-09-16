/**
 * Permission Management Service
 * 
 * This service provides functions for managing the flexible permissions system.
 * It integrates with Supabase and provides both server-side and client-side
 * permission management capabilities.
 * 
 * Note: This service is designed to work both before and after the permission
 * system migrations are applied. It includes fallbacks for when the new tables
 * and functions don't exist yet.
 */

import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseClient } from '@/lib/supabaseClient'
import type { Database } from '@isleno/types/db/public'

// Use generated types from the database
export type ResourceType = Database['public']['Enums']['resource_type']
export type PermissionAction = Database['public']['Enums']['permission_action']

// Use generated types from the database
type Permission = Database['public']['Tables']['permissions']['Row']

type PermissionInsert = Database['public']['Tables']['permissions']['Insert']

type UserPermission = Database['public']['Tables']['user_permissions']['Row']

type UserPermissionInsert = Database['public']['Tables']['user_permissions']['Insert']

type RolePermission = Database['public']['Tables']['role_permissions']['Row']

type RolePermissionInsert = Database['public']['Tables']['role_permissions']['Insert']

export interface PermissionContext {
  department_id?: string
  location?: string
  resource_id?: string
  [key: string]: string | undefined
}

export interface UserPermissionWithDetails extends UserPermission {
  permission: Permission
}

export interface RolePermissionWithDetails extends RolePermission {
  permission: Permission
}

/**
 * Server-side permission service (for API routes and server components)
 */
export class ServerPermissionService {
  private async getSupabase() {
    return await supabaseServer()
  }

  // Public accessor for utility functions
  async getSupabaseClient() {
    return await this.getSupabase()
  }

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(
    userId: string,
    permissionName: string,
    context: PermissionContext = {}
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // FIRST CHECK: Admin access - if user is admin, grant access to everything
      const isAdmin = await PermissionUtils.isAdmin(this, userId)
      if (isAdmin) {
        return true
      }
      
      // Check if the RPC function exists, if not fall back to role-based check
      try {
        const { data, error } = await (supabase as any).rpc('user_has_permission', {
          check_user_id: userId,
          permission_name: permissionName,
          resource_context: context
        })

        if (error) {
          console.error('Error checking user permission:', error)
          return false
        }

        return data || false
      } catch (rpcError) {
        // Fallback to role-based permission check if RPC doesn't exist
        console.warn('RPC function not available, falling back to role check')
        return await this.checkRoleBasedPermission(userId, permissionName)
      }
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    }
  }

  /**
   * Check if a user can access department-level resources
   */
  async canAccessDepartmentResources(
    userId: string,
    departmentId: string,
    resourceType: ResourceType,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // FIRST CHECK: Admin access - if user is admin, grant access to all departments
      const isAdmin = await PermissionUtils.isAdmin(this, userId)
      if (isAdmin) {
        return true
      }
      
      // Check if the RPC function exists
      try {
        const { data, error } = await (supabase as any).rpc('can_access_department_resources', {
          check_user_id: userId,
          target_department_id: departmentId,
          resource_type: resourceType,
          action: action
        })

        if (error) {
          console.error('Error checking department access:', error)
          return false
        }

        return data || false
      } catch (rpcError) {
        // Fallback to manual check
        console.warn('RPC function not available, falling back to manual check')
        return await this.checkDepartmentAccessManually(userId, departmentId, resourceType, action)
      }
    } catch (error) {
      console.error('Error checking department access:', error)
      return false
    }
  }

  /**
   * Manual fallback for department access checking
   */
  private async checkDepartmentAccessManually(
    userId: string,
    departmentId: string,
    resourceType: ResourceType,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // Get user's department
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id')
        .eq('id', userId)
        .single()

      const userDepartmentId = profile?.department_id

      // Check if user is department head of the target department
      if (userDepartmentId === departmentId) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'department_head')
          .single()

        if (roleData) {
          // Department heads have broader access to their department's resources
          // This is handled through the department_id column in user_permissions
          // and the can_access_department_resource function
          return true // Department heads have access to all resources in their department
        }
      }

      // Check individual permission with department context
      const individualPermission = PermissionUtils.buildPermissionName(resourceType, action)
      return await this.userHasPermission(userId, individualPermission, { department_id: departmentId })
    } catch (error) {
      console.error('Error in manual department access check:', error)
      return false
    }
  }

  /**
   * Fallback method to check role-based permissions
   */
  private async checkRoleBasedPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if user has admin role (admin has all permissions)
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()
      
      if (adminRole) {
        return true
      }

      // Check other role-based permissions
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      if (!userRoles || userRoles.length === 0) {
        return false
      }

      // Define basic role permissions according to new specifications
      const rolePermissions: Record<string, string[]> = {
        'default': [], // No permissions - new users
        'internal': ['kpi.view', 'department.view'], // Department-scoped access only
        'department_head': ['kpi.view', 'department.view', 'user.view'], // Department-scoped access + user management
        'admin': ['kpi.view', 'kpi.create', 'kpi.edit', 'kpi.delete', 'department.view', 'department.create', 'department.edit', 'user.view', 'user.edit', 'invoice.view', 'invoice.create', 'invoice.edit', 'invoice.delete', 'invoice.approve'] // All permissions
      }

      for (const userRole of userRoles) {
        const role = userRole.role
        if (rolePermissions[role]?.includes(permissionName)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking role-based permission:', error)
      return false
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string) {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any).rpc('get_user_permissions', {
          check_user_id: userId
        })

        if (error) {
          // If it's the enum type mismatch error, fall back to role-based permissions
          if (error.code === '42804' && error.message.includes('structure of query does not match function result type')) {
            console.warn('Database function has type mismatch, falling back to role-based permissions')
            return await this.getRoleBasedPermissions(userId)
          }
          console.error('Error getting user permissions:', error)
          return []
        }

        return data || []
      } catch (rpcError) {
        // Fallback to role-based permissions
        console.warn('RPC function not available, returning role-based permissions')
        return await this.getRoleBasedPermissions(userId)
      }
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Get role-based permissions for a user
   */
  private async getRoleBasedPermissions(userId: string): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()
      
      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      if (!userRoles || userRoles.length === 0) {
        return []
      }

      // Return basic role-based permissions
      const permissions = []
      for (const userRole of userRoles) {
        const role = userRole.role
        
        // Define basic permissions for each role
        if (role === 'admin') {
          permissions.push(
            { permission_name: 'system.admin', source: 'role' },
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'kpi.delete', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'department.create', source: 'role' },
            { permission_name: 'department.edit', source: 'role' },
            { permission_name: 'department.delete', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'user.edit', source: 'role' },
            { permission_name: 'user.manage_roles', source: 'role' },
            { permission_name: 'user.manage_permissions', source: 'role' }
          )
        } else if (role === 'internal') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'department.create', source: 'role' },
            { permission_name: 'department.edit', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'users.edit', source: 'role' }
          )
        } else if (role === 'department_head') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'kpi.delete', source: 'role' },
            { permission_name: 'kpi.snapshot', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'project.view', source: 'role' },
            { permission_name: 'project.create', source: 'role' },
            { permission_name: 'project.edit', source: 'role' },
            { permission_name: 'project.delete', source: 'role' },
            { permission_name: 'invoice.view', source: 'role' },
            { permission_name: 'invoice.approve', source: 'role' },
            { permission_name: 'invoice.edit', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'user.manage_roles', source: 'role' },
            { permission_name: 'user.manage_permissions', source: 'role' }
          )
        } else if (role === 'external_basic') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'users.view', source: 'role' }
          )
        } else {
          // default role
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'users.view', source: 'role' }
          )
        }
      }

      return permissions
    } catch (error) {
      console.error('Error getting role-based permissions:', error)
      return []
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('permissions')
          .select('*')
          .order('resource_type', { ascending: true })
          .order('action', { ascending: true })

        if (error) {
          console.error('Error getting permissions:', error)
          return []
        }

        return (data as any) || []
      } catch (tableError) {
        // Fallback to predefined permissions if table doesn't exist yet
        console.warn('Permissions table not available, returning predefined permissions')
        return this.getPredefinedPermissions()
      }
    } catch (error) {
      console.error('Error getting permissions:', error)
      return []
    }
  }

  /**
   * Get predefined permissions with strict enum typing
   */
  private getPredefinedPermissions(): Permission[] {
    return [
      { id: '1', name: 'kpi.view', description: 'View KPIs', resource_type: 'kpi', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'kpi.create', description: 'Create KPIs', resource_type: 'kpi', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', name: 'kpi.edit', description: 'Edit KPIs', resource_type: 'kpi', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '4', name: 'kpi.delete', description: 'Delete KPIs', resource_type: 'kpi', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '5', name: 'kpi.snapshot', description: 'Create KPI snapshots', resource_type: 'kpi', action: 'snapshot', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '6', name: 'department.view', description: 'View departments', resource_type: 'department', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '7', name: 'department.create', description: 'Create departments', resource_type: 'department', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '8', name: 'department.edit', description: 'Edit departments', resource_type: 'department', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '9', name: 'department.delete', description: 'Delete departments', resource_type: 'department', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '10', name: 'project.view', description: 'View projects', resource_type: 'project', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '11', name: 'project.create', description: 'Create projects', resource_type: 'project', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '12', name: 'project.edit', description: 'Edit projects', resource_type: 'project', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '13', name: 'project.delete', description: 'Delete projects', resource_type: 'project', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '14', name: 'invoice.view', description: 'View invoices', resource_type: 'invoice', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '15', name: 'invoice.create', description: 'Create invoices', resource_type: 'invoice', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '16', name: 'invoice.edit', description: 'Edit invoices', resource_type: 'invoice', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '17', name: 'invoice.approve', description: 'Approve invoices', resource_type: 'invoice', action: 'approve', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '18', name: 'invoice.delete', description: 'Delete invoices', resource_type: 'invoice', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '19', name: 'user.view', description: 'View user profiles', resource_type: 'user', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '20', name: 'user.edit', description: 'Edit user profiles', resource_type: 'user', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '21', name: 'user.manage_roles', description: 'Manage user roles', resource_type: 'user', action: 'manage_roles', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '22', name: 'user.manage_permissions', description: 'Manage user permissions', resource_type: 'user', action: 'manage_permissions', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '23', name: 'system.admin', description: 'Full system administration', resource_type: 'system', action: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '24', name: 'system.audit', description: 'View audit logs', resource_type: 'system', action: 'audit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
  }

  /**
   * Create a new permission
   */
  async createPermission(permission: PermissionInsert): Promise<Permission | null> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('permissions')
          .insert(permission)
          .select()
          .single()

        if (error) {
          console.error('Error creating permission:', error)
          return null
        }

        return data as any
      } catch (tableError) {
        console.warn('Permissions table not available, cannot create permission')
        return null
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      return null
    }
  }

  /**
   * Assign a permission to a user
   */
  async assignUserPermission(
    userPermission: Omit<UserPermissionInsert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserPermission | null> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('user_permissions')
          .insert({
            ...userPermission,
            granted_by: userPermission.granted_by || userPermission.user_id
          })
          .select()
          .single()

        if (error) {
          console.error('Error assigning user permission:', error)
          return null
        }

        return data as any
      } catch (tableError) {
        console.warn('User permissions table not available, cannot assign permission')
        return null
      }
    } catch (error) {
      console.error('Error assigning user permission:', error)
      return null
    }
  }

  /**
   * Remove a permission from a user
   */
  async removeUserPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { error } = await (supabase as any)
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('permission_id', permissionId)

        if (error) {
          console.error('Error removing user permission:', error)
          return false
        }

        return true
      } catch (tableError) {
        console.warn('User permissions table not available, cannot remove permission')
        return false
      }
    } catch (error) {
      console.error('Error removing user permission:', error)
      return false
    }
  }

  /**
   * Assign a permission to a role
   */
  async assignRolePermission(
    rolePermission: Omit<RolePermissionInsert, 'id' | 'created_at'>
  ): Promise<RolePermission | null> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('role_permissions')
          .insert(rolePermission)
          .select()
          .single()

        if (error) {
          console.error('Error assigning role permission:', error)
          return null
        }

        return data as any
      } catch (tableError) {
        console.warn('Role permissions table not available, cannot assign permission')
        return null
      }
    } catch (error) {
      console.error('Error assigning role permission:', error)
      return null
    }
  }

  /**
   * Remove a permission from a role
   */
  async removeRolePermission(roleName: string, permissionId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { error } = await (supabase as any)
          .from('role_permissions')
          .delete()
          .eq('role_name', roleName)
          .eq('permission_id', permissionId)

        if (error) {
          console.error('Error removing role permission:', error)
          return false
        }

        return true
      } catch (tableError) {
        console.warn('Role permissions table not available, cannot remove permission')
        return false
      }
    } catch (error) {
      console.error('Error removing role permission:', error)
      return false
    }
  }

  /**
   * Get user-specific permissions with details
   */
  async getUserPermissionsWithDetails(userId: string): Promise<UserPermissionWithDetails[]> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('user_permissions')
          .select(`
            *,
            permission:permissions(*)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)

        if (error) {
          console.error('Error getting user permissions with details:', error)
          return []
        }

        return (data as any) || []
      } catch (tableError) {
        console.warn('User permissions table not available, returning empty array')
        return []
      }
    } catch (error) {
      console.error('Error getting user permissions with details:', error)
      return []
    }
  }

  /**
   * Get role permissions with details
   */
  async getRolePermissionsWithDetails(roleName: string): Promise<RolePermissionWithDetails[]> {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('role_permissions')
          .select(`
            *,
            permission:permissions(*)
          `)
          .eq('role_name', roleName)

        if (error) {
          console.error('Error getting role permissions with details:', error)
          return []
        }

        return (data as any) || []
      } catch (tableError) {
        console.warn('Role permissions table not available, returning empty array')
        return []
      }
    } catch (error) {
      console.error('Error getting role permissions with details:', error)
      return []
    }
  }

  /**
   * Get permission audit logs
   */
  async getPermissionAuditLogs(limit: number = 100) {
    try {
      const supabase = await this.getSupabase()
      
      try {
        const { data, error } = await (supabase as any)
          .from('permission_audit')
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Error getting permission audit logs:', error)
          return []
        }

        return data || []
      } catch (tableError) {
        console.warn('Permission audit table not available, returning empty array')
        return []
      }
    } catch (error) {
      console.error('Error getting permission audit logs:', error)
      return []
    }
  }

  /**
   * Assign admin role to a user (CEO and IT users only)
   */
  async assignAdminRole(userId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()

      if (existingRole) {
        return true // Already admin
      }

      // Assign admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        })

      if (error) {
        console.error('Error assigning admin role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error assigning admin role:', error)
      return false
    }
  }

  /**
   * Remove admin role from a user
   */
  async removeAdminRole(userId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin')

      if (error) {
        console.error('Error removing admin role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error removing admin role:', error)
      return false
    }
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<Array<{ user_id: string; full_name: string; email: string; created_at: string }>> {
    return await PermissionUtils.getAdminUsers(this)
  }

  /**
   * Check if user is admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    return await PermissionUtils.isAdmin(this, userId)
  }
}

/**
 * Client-side permission service (for client components)
 */
export class ClientPermissionService {
  private supabase = supabaseClient

  // Public accessor for utility functions
  getSupabaseClient() {
    return this.supabase
  }

  /**
   * Check if current user has a specific permission
   */
  async userHasPermission(
    permissionName: string,
    context: PermissionContext = {}
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      try {
        const { data, error } = await (this.supabase as any).rpc('user_has_permission', {
          check_user_id: user.id,
          permission_name: permissionName,
          resource_context: context
        })

        if (error) {
          console.error('Error checking user permission:', error)
          return false
        }

        return data || false
      } catch (rpcError) {
        // Fallback to role-based permission check if RPC doesn't exist
        console.warn('RPC function not available, falling back to role check')
        return await this.checkRoleBasedPermission(user.id, permissionName)
      }
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    }
  }

  /**
   * Fallback method to check role-based permissions
   */
  private async checkRoleBasedPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Check if user has admin role (admin has all permissions)
      const { data: adminRole } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()
      
      if (adminRole) {
        return true
      }

      // Check other role-based permissions
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      if (!userRoles || userRoles.length === 0) {
        return false
      }

      // Define basic role permissions according to new specifications
      const rolePermissions: Record<string, string[]> = {
        'default': [], // No permissions - new users
        'internal': ['kpi.view', 'department.view'], // Department-scoped access only
        'department_head': ['kpi.view', 'department.view', 'user.view'], // Department-scoped access + user management
        'admin': ['kpi.view', 'kpi.create', 'kpi.edit', 'kpi.delete', 'department.view', 'department.create', 'department.edit', 'user.view', 'user.edit', 'invoice.view', 'invoice.create', 'invoice.edit', 'invoice.delete', 'invoice.approve'] // All permissions
      }

      for (const userRole of userRoles) {
        const role = userRole.role
        if (rolePermissions[role]?.includes(permissionName)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking role-based permission:', error)
      return false
    }
  }

  /**
   * Get all permissions for current user
   */
  async getUserPermissions() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      try {
        const { data, error } = await (this.supabase as any).rpc('get_user_permissions', {
          check_user_id: user.id
        })

        if (error) {
          // If it's the enum type mismatch error, fall back to role-based permissions
          if (error.code === '42804' && error.message.includes('structure of query does not match function result type')) {
            console.warn('Database function has type mismatch, falling back to role-based permissions')
            return await this.getRoleBasedPermissions(user.id)
          }
          console.error('Error getting user permissions:', error)
          return []
        }

        return data || []
      } catch (rpcError) {
        // Fallback to role-based permissions
        console.warn('RPC function not available, returning role-based permissions')
        return await this.getRoleBasedPermissions(user.id)
      }
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Get role-based permissions for a user
   */
  private async getRoleBasedPermissions(userId: string): Promise<any[]> {
    try {
      // Get user roles
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      if (!userRoles || userRoles.length === 0) {
        return []
      }

      // Return basic role-based permissions
      const permissions = []
      for (const userRole of userRoles) {
        const role = userRole.role
        
        // Define basic permissions for each role
        if (role === 'admin') {
          permissions.push(
            { permission_name: 'system.admin', source: 'role' },
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'kpi.delete', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'department.create', source: 'role' },
            { permission_name: 'department.edit', source: 'role' },
            { permission_name: 'department.delete', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'user.edit', source: 'role' },
            { permission_name: 'user.manage_roles', source: 'role' },
            { permission_name: 'user.manage_permissions', source: 'role' }
          )
        } else if (role === 'internal') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'department.create', source: 'role' },
            { permission_name: 'department.edit', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'users.edit', source: 'role' }
          )
        } else if (role === 'department_head') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'kpi.create', source: 'role' },
            { permission_name: 'kpi.edit', source: 'role' },
            { permission_name: 'kpi.delete', source: 'role' },
            { permission_name: 'kpi.snapshot', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'project.view', source: 'role' },
            { permission_name: 'project.create', source: 'role' },
            { permission_name: 'project.edit', source: 'role' },
            { permission_name: 'project.delete', source: 'role' },
            { permission_name: 'invoice.view', source: 'role' },
            { permission_name: 'invoice.approve', source: 'role' },
            { permission_name: 'invoice.edit', source: 'role' },
            { permission_name: 'user.view', source: 'role' },
            { permission_name: 'user.manage_roles', source: 'role' },
            { permission_name: 'user.manage_permissions', source: 'role' }
          )
        } else if (role === 'external_basic') {
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'users.view', source: 'role' }
          )
        } else {
          // default role
          permissions.push(
            { permission_name: 'kpi.view', source: 'role' },
            { permission_name: 'department.view', source: 'role' },
            { permission_name: 'users.view', source: 'role' }
          )
        }
      }

      return permissions
    } catch (error) {
      console.error('Error getting role-based permissions:', error)
      return []
    }
  }

  /**
   * Get all available permissions (read-only for clients)
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      try {
        const { data, error } = await (this.supabase as any)
          .from('permissions')
          .select('*')
          .order('resource_type', { ascending: true })
          .order('action', { ascending: true })

        if (error) {
          console.error('Error getting permissions:', error)
          return []
        }

        return (data as any) || []
      } catch (tableError) {
        // Fallback to predefined permissions if table doesn't exist yet
        console.warn('Permissions table not available, returning predefined permissions')
        return this.getPredefinedPermissions()
      }
    } catch (error) {
      console.error('Error getting permissions:', error)
      return []
    }
  }

  /**
   * Get predefined permissions (same as server version)
   */
  private getPredefinedPermissions(): Permission[] {
    return [
      { id: '1', name: 'kpi.view', description: 'View KPIs', resource_type: 'kpi', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'kpi.create', description: 'Create KPIs', resource_type: 'kpi', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', name: 'kpi.edit', description: 'Edit KPIs', resource_type: 'kpi', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '4', name: 'kpi.delete', description: 'Delete KPIs', resource_type: 'kpi', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '5', name: 'kpi.snapshot', description: 'Create KPI snapshots', resource_type: 'kpi', action: 'snapshot', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '6', name: 'department.view', description: 'View departments', resource_type: 'department', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '7', name: 'department.create', description: 'Create departments', resource_type: 'department', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '8', name: 'department.edit', description: 'Edit departments', resource_type: 'department', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '9', name: 'department.delete', description: 'Delete departments', resource_type: 'department', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '10', name: 'project.view', description: 'View projects', resource_type: 'project', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '11', name: 'project.create', description: 'Create projects', resource_type: 'project', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '12', name: 'project.edit', description: 'Edit projects', resource_type: 'project', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '13', name: 'project.delete', description: 'Delete projects', resource_type: 'project', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '14', name: 'invoice.view', description: 'View invoices', resource_type: 'invoice', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '15', name: 'invoice.create', description: 'Create invoices', resource_type: 'invoice', action: 'create', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '16', name: 'invoice.edit', description: 'Edit invoices', resource_type: 'invoice', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '17', name: 'invoice.approve', description: 'Approve invoices', resource_type: 'invoice', action: 'approve', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '18', name: 'invoice.delete', description: 'Delete invoices', resource_type: 'invoice', action: 'delete', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '19', name: 'user.view', description: 'View user profiles', resource_type: 'user', action: 'view', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '20', name: 'user.edit', description: 'Edit user profiles', resource_type: 'user', action: 'edit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '21', name: 'user.manage_roles', description: 'Manage user roles', resource_type: 'user', action: 'manage_roles', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '22', name: 'user.manage_permissions', description: 'Manage user permissions', resource_type: 'user', action: 'manage_permissions', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '23', name: 'system.admin', description: 'Full system administration', resource_type: 'system', action: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '24', name: 'system.audit', description: 'View audit logs', resource_type: 'system', action: 'audit', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
  }
}

/**
 * Permission utility functions
 */
export class PermissionUtils {
  /**
   * Parse permission name into resource and action with strict typing
   */
  static parsePermissionName(permissionName: string): { resource: ResourceType; action: PermissionAction } {
    const parts = permissionName.split('.')
    if (parts.length !== 2) {
      throw new Error(`Invalid permission name format: ${permissionName}. Expected format: resource.action`)
    }
    
    const [resource, action] = parts
    
    // Validate resource type
    const validResources: ResourceType[] = ['kpi', 'department', 'project', 'invoice', 'user', 'system', 'snapshot', 'board', 'integration', 'audit']
    if (!validResources.includes(resource as ResourceType)) {
      throw new Error(`Invalid resource type: ${resource}. Valid types: ${validResources.join(', ')}`)
    }
    
    // Validate action
    const validActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'snapshot', 'manage_roles', 'manage_permissions', 'admin', 'audit', 'export', 'import', 'configure']
    if (!validActions.includes(action as PermissionAction)) {
      throw new Error(`Invalid action: ${action}. Valid actions: ${validActions.join(', ')}`)
    }
    
    return {
      resource: resource as ResourceType,
      action: action as PermissionAction
    }
  }

  /**
   * Build permission name from resource and action with strict typing
   */
  static buildPermissionName(resource: ResourceType, action: PermissionAction): string {
    return `${resource}.${action}`
  }

  /**
   * Check if a permission name is valid with strict enum validation
   */
  static isValidPermissionName(permissionName: string): boolean {
    try {
      this.parsePermissionName(permissionName)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get common permission patterns for a resource with strict typing
   */
  static getCommonPermissionsForResource(resource: ResourceType): string[] {
    const commonActions: PermissionAction[] = ['view', 'create', 'edit', 'delete']
    return commonActions.map(action => this.buildPermissionName(resource, action))
  }

  /**
   * Get all valid resource types
   */
  static getValidResourceTypes(): ResourceType[] {
    return ['kpi', 'department', 'project', 'invoice', 'user', 'system', 'snapshot', 'board', 'integration', 'audit', 'admin']
  }

  /**
   * Get all valid actions
   */
  static getValidActions(): PermissionAction[] {
    return ['view', 'create', 'edit', 'delete', 'approve', 'snapshot', 'manage_roles', 'manage_permissions', 'admin', 'audit', 'export', 'import', 'configure']
  }

  /**
   * Get all possible permission combinations
   */
  static getAllPermissionCombinations(): string[] {
    const combinations: string[] = []
    for (const resource of this.getValidResourceTypes()) {
      for (const action of this.getValidActions()) {
        combinations.push(this.buildPermissionName(resource, action))
      }
    }
    return combinations
  }

  /**
   * Group permissions by resource type
   */
  static groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((groups, permission) => {
      const resource = permission.resource_type
      if (!groups[resource]) {
        groups[resource] = []
      }
      groups[resource].push(permission)
      return groups
    }, {} as Record<string, Permission[]>)
  }

  /**
   * Check if user has any permission for a resource
   */
  static async hasAnyPermissionForResource(
    service: ServerPermissionService | ClientPermissionService,
    userId: string,
    resource: ResourceType
  ): Promise<boolean> {
    const commonPermissions = this.getCommonPermissionsForResource(resource)
    
    for (const permission of commonPermissions) {
      // Handle different method signatures for server vs client service
      let hasPermission: boolean
      if (service instanceof ServerPermissionService) {
        hasPermission = await service.userHasPermission(userId, permission)
      } else {
        hasPermission = await service.userHasPermission(permission)
      }
      if (hasPermission) return true
    }
    
    return false
  }

  /**
   * Check if a user has department-level access to a resource
   * This is now handled through the department_id column in user_permissions
   * and the can_access_department_resource function
   */
  static async hasDepartmentLevelAccess(
    service: ServerPermissionService,
    userId: string,
    departmentId: string,
    resourceType: ResourceType,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      const supabase = await service.getSupabaseClient()
      const { data, error } = await supabase.rpc('can_access_department_resource', {
        check_user_id: userId,
        target_department_id: departmentId,
        resource_type: resourceType,
        action: action
      })
      
      if (error) {
        console.error('Error checking department access:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error checking department access:', error)
      return false
    }
  }

  /**
   * Check if user is department head
   */
  static async isDepartmentHead(
    service: ServerPermissionService | ClientPermissionService,
    userId: string
  ): Promise<boolean> {
    try {
      if (service instanceof ServerPermissionService) {
        const supabase = await service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'department_head')
          .single()
        return !!data
      } else {
        const supabase = service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'department_head')
          .single()
        return !!data
      }
    } catch (error) {
      console.error('Error checking department head status:', error)
      return false
    }
  }

  /**
   * Get user's department ID
   */
  static async getUserDepartment(
    service: ServerPermissionService | ClientPermissionService,
    userId: string
  ): Promise<string | null> {
    try {
      if (service instanceof ServerPermissionService) {
        const supabase = await service.getSupabaseClient()
        const { data } = await supabase
          .from('profiles')
          .select('department_id')
          .eq('id', userId)
          .single()
        return data?.department_id || null
      } else {
        const supabase = service.getSupabaseClient()
        const { data } = await supabase
          .from('profiles')
          .select('department_id')
          .eq('id', userId)
          .single()
        return data?.department_id || null
      }
    } catch (error) {
      console.error('Error getting user department:', error)
      return null
    }
  }

  /**
   * Check if user is admin (has full system access)
   */
  static async isAdmin(
    service: ServerPermissionService | ClientPermissionService,
    userId: string
  ): Promise<boolean> {
    try {
      if (service instanceof ServerPermissionService) {
        const supabase = await service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .single()
        return !!data
      } else {
        const supabase = service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .single()
        return !!data
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Get all admin users (CEO and IT users)
   */
  static async getAdminUsers(
    service: ServerPermissionService | ClientPermissionService
  ): Promise<Array<{ user_id: string; full_name: string; email: string; created_at: string }>> {
    try {
      if (service instanceof ServerPermissionService) {
        const supabase = await service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            profiles!inner (
              full_name
            ),
            auth.users!inner (
              email,
              created_at
            )
          `)
          .eq('role', 'admin')
          .order('created_at', { ascending: false })
        
        return (data as any)?.map((item: any) => ({
          user_id: item.user_id,
          full_name: item.profiles.full_name,
          email: item.auth.users.email,
          created_at: item.auth.users.created_at
        })) || []
      } else {
        const supabase = service.getSupabaseClient()
        const { data } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            profiles!inner (
              full_name
            ),
            auth.users!inner (
              email,
              created_at
            )
          `)
          .eq('role', 'admin')
          .order('created_at', { ascending: false })
        
        return (data as any)?.map((item: any) => ({
          user_id: item.user_id,
          full_name: item.profiles.full_name,
          email: item.auth.users.email,
          created_at: item.auth.users.created_at
        })) || []
      }
    } catch (error) {
      console.error('Error getting admin users:', error)
      return []
    }
  }

  /**
   * Check if user has admin-level access (bypasses all other permission checks)
   */
  static async hasAdminAccess(
    service: ServerPermissionService | ClientPermissionService,
    userId: string
  ): Promise<boolean> {
    return await this.isAdmin(service, userId)
  }

  /**
   * Get admin permissions (full system access)
   */
  static getAdminPermissions(): string[] {
    return [
      'admin.admin',
      'admin.view',
      'admin.create',
      'admin.edit',
      'admin.delete',
      'admin.manage_roles',
      'admin.manage_permissions',
      'admin.audit',
      'admin.export',
      'admin.import',
      'admin.configure'
    ]
  }
}

// Export singleton instances
export const serverPermissionService = new ServerPermissionService()
export const clientPermissionService = new ClientPermissionService()

// Export types
export type {
  Permission,
  PermissionInsert,
  UserPermission,
  UserPermissionInsert,
  RolePermission,
  RolePermissionInsert
}