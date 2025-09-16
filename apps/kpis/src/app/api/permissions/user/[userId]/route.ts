/**
 * API Routes for User Permission Management
 * 
 * This file provides REST API endpoints for managing user-specific permissions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/permissions/user/[userId] - Get user permissions
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Check if user can view permissions (own or manage permissions)
    const canViewOwn = user.id === userId
    const canManagePermissions = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_permissions'
    )
    
    if (!canViewOwn && !canManagePermissions) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const permissions = await serverPermissionService.getUserPermissions(userId)
    const permissionsWithDetails = await serverPermissionService.getUserPermissionsWithDetails(userId)
    
    return NextResponse.json({ 
      permissions,
      permissionsWithDetails 
    })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/permissions/user/[userId] - Assign permission to user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage user permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_permissions'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = params
    const body = await request.json()
    const { permission_id, conditions, expires_at } = body

    // Validate required fields
    if (!permission_id) {
      return NextResponse.json(
        { error: 'Missing required field: permission_id' },
        { status: 400 }
      )
    }

    const userPermission = await serverPermissionService.assignUserPermission({
      user_id: userId,
      permission_id,
      conditions,
      expires_at,
      granted_by: user.id
    })

    if (!userPermission) {
      return NextResponse.json(
        { error: 'Failed to assign permission to user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userPermission }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/permissions/user/[userId] - Remove permission from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage user permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'users.manage_permissions'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = params
    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('permission_id')

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: permission_id' },
        { status: 400 }
      )
    }

    const success = await serverPermissionService.removeUserPermission(userId, permissionId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove permission from user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
