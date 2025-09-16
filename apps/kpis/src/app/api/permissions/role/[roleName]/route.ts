/**
 * API Routes for Role Permission Management
 * 
 * This file provides REST API endpoints for managing role-based permissions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/permissions/role/[roleName] - Get role permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage role permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_roles'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { roleName } = await params
    const permissionsWithDetails = await serverPermissionService.getRolePermissionsWithDetails(roleName)
    
    return NextResponse.json({ 
      roleName,
      permissionsWithDetails 
    })
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/permissions/role/[roleName] - Assign permission to role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage role permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_roles'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { roleName } = await params
    const body = await request.json()
    const { permission_id } = body

    // Validate required fields
    if (!permission_id) {
      return NextResponse.json(
        { error: 'Missing required field: permission_id' },
        { status: 400 }
      )
    }

    const rolePermission = await serverPermissionService.assignRolePermission({
      role_name: roleName,
      permission_id,
      created_by: user.id
    })

    if (!rolePermission) {
      return NextResponse.json(
        { error: 'Failed to assign permission to role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ rolePermission }, { status: 201 })
  } catch (error) {
    console.error('Error assigning role permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/permissions/role/[roleName] - Remove permission from role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleName: string }> }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage role permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_roles'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { roleName } = await params
    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('permission_id')

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: permission_id' },
        { status: 400 }
      )
    }

    const success = await serverPermissionService.removeRolePermission(roleName, permissionId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove permission from role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing role permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
