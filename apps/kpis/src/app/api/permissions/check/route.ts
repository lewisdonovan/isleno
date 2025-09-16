/**
 * API Route for Permission Checking
 * 
 * This endpoint allows checking if a user has specific permissions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/permissions/check - Check user permissions
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { permission_name, context = {}, user_id } = body

    // Validate required fields
    if (!permission_name) {
      return NextResponse.json(
        { error: 'Missing required field: permission_name' },
        { status: 400 }
      )
    }

    // Use provided user_id or current user's id
    const targetUserId = user_id || user.id

    // Check if user can check permissions for other users
    if (targetUserId !== user.id) {
      const canManagePermissions = await serverPermissionService.userHasPermission(
        user.id,
        'users.manage_permissions'
      )
      
      if (!canManagePermissions) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const hasPermission = await serverPermissionService.userHasPermission(
      targetUserId,
      permission_name,
      context
    )

    return NextResponse.json({ 
      hasPermission,
      user_id: targetUserId,
      permission_name,
      context 
    })
  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/permissions/check - Get current user's permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await serverPermissionService.getUserPermissions(user.id)

    return NextResponse.json({ 
      user_id: user.id,
      permissions 
    })
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
