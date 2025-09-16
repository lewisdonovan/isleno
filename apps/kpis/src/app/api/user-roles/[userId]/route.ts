/**
 * API Routes for Individual User Role Management
 * 
 * This file provides REST API endpoints for managing individual user roles and permissions.
 * All endpoints require admin permissions and are protected by RLS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@isleno/types/db/public'

// GET /api/user-roles/[userId] - Get detailed user info with roles and permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { userId } = await params
    
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

    // Get user profile with department info
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select(`
        id,
        full_name,
        job_title,
        department_id,
        location,
        departments(department_name)
      `)
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user roles
    const { data: roles, error: rolesError } = await serviceSupabase
      .from('user_roles')
      .select('role, created_at')
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
    }

    // Get user permissions
    const userPermissions = await serverPermissionService.getUserPermissions(userId)

    // Get all available permissions for the UI
    const allPermissions = await serverPermissionService.getAllPermissions()

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.full_name,
        job_title: profile.job_title,
        department_id: profile.department_id,
        department_name: profile.departments?.department_name,
        location: profile.location,
        roles: roles.map(r => r.role),
        permissions: [...new Set(userPermissions.map((p: any) => p.permission_name || p))],
        all_permissions: allPermissions
      }
    })
  } catch (error) {
    console.error('Error in user detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/user-roles/[userId] - Assign role to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { userId } = await params
    const { role } = await request.json()
    
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

    // Validate role
    const validRoles = ['admin', 'department_head', 'default']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create service role client to bypass RLS policies
    const serviceSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Assign role
    const { error: assignError } = await serviceSupabase
      .from('user_roles')
      .insert({ user_id: userId, role: role })
    
    if (assignError) {
      console.error('Error assigning role:', assignError)
      return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Role assigned successfully' })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user-roles/[userId] - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    
    if (!role) {
      return NextResponse.json({ error: 'Role parameter required' }, { status: 400 })
    }
    
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

    // Remove role
    const { error: removeError } = await serviceSupabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)
    
    if (removeError) {
      console.error('Error removing role:', removeError)
      return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Role removed successfully' })
  } catch (error) {
    console.error('Error removing role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
