/**
 * API Routes for User Roles Management
 * 
 * This file provides REST API endpoints for managing user roles.
 * All endpoints require admin permissions and are protected by RLS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@isleno/types/db/public'

// GET /api/user-roles - Get all users with their roles and profile info
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permission
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'admin.admin'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Create service role client to bypass RLS policies
    const serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all users with their profiles and departments
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select(`
        id,
        full_name,
        job_title,
        department_id,
        departments(department_name)
      `)
      .order('full_name')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await serviceSupabase
      .from('user_roles')
      .select('user_id, role, created_at')

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
    }

    // Transform data to include highest role
    const transformedUsers = profiles.map(profile => {
      const userRolesForProfile = userRoles.filter(ur => ur.user_id === profile.id)
      return {
        id: profile.id,
        name: profile.full_name,
        job_title: profile.job_title,
        department_id: profile.department_id,
        department_name: profile.departments?.department_name,
        roles: userRolesForProfile.map(ur => ur.role),
        highest_role: getHighestRole(userRolesForProfile.map(ur => ur.role)),
        created_at: userRolesForProfile[0]?.created_at
      }
    })

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Error in user roles API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to determine highest role
function getHighestRole(roles: string[]): string {
  const roleHierarchy = ['admin', 'department_head', 'default']
  
  for (const role of roleHierarchy) {
    if (roles.includes(role)) {
      return role
    }
  }
  
  return 'none'
}
