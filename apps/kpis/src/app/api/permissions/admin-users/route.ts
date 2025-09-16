/**
 * API Route for Admin User Management
 * 
 * This endpoint allows managing admin users (CEO and IT users).
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/permissions/admin-users - Get all admin users
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const isAdmin = await serverPermissionService.isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all admin users
    const adminUsers = await serverPermissionService.getAdminUsers()

    return NextResponse.json({ 
      adminUsers,
      count: adminUsers.length
    })
  } catch (error) {
    console.error('Error getting admin users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/permissions/admin-users - Assign admin role to user
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const isAdmin = await serverPermissionService.isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { target_user_id } = body

    // Validate required fields
    if (!target_user_id) {
      return NextResponse.json(
        { error: 'Missing required field: target_user_id' },
        { status: 400 }
      )
    }

    // Assign admin role
    const success = await serverPermissionService.assignAdminRole(target_user_id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to assign admin role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin role assigned successfully',
      target_user_id
    })
  } catch (error) {
    console.error('Error assigning admin role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/permissions/admin-users - Remove admin role from user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const isAdmin = await serverPermissionService.isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { target_user_id } = body

    // Validate required fields
    if (!target_user_id) {
      return NextResponse.json(
        { error: 'Missing required field: target_user_id' },
        { status: 400 }
      )
    }

    // Prevent removing admin role from self
    if (target_user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove admin role from yourself' },
        { status: 400 }
      )
    }

    // Remove admin role
    const success = await serverPermissionService.removeAdminRole(target_user_id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove admin role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin role removed successfully',
      target_user_id
    })
  } catch (error) {
    console.error('Error removing admin role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
