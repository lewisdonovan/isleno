/**
 * API Routes for Permission Management
 * 
 * This file provides REST API endpoints for managing the flexible permissions system.
 * All endpoints require appropriate permissions and are protected by RLS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'system.admin'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const permissions = await serverPermissionService.getAllPermissions()
    
    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create permissions
    const hasPermission = await serverPermissionService.userHasPermission(
      user.id,
      'system.admin'
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, resource_type, action } = body

    // Validate required fields
    if (!name || !resource_type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: name, resource_type, action' },
        { status: 400 }
      )
    }

    // Validate permission name format
    if (!name.includes('.') || name.split('.').length !== 2) {
      return NextResponse.json(
        { error: 'Invalid permission name format. Expected: resource.action' },
        { status: 400 }
      )
    }

    const permission = await serverPermissionService.createPermission({
      name,
      description,
      resource_type,
      action
    })

    if (!permission) {
      return NextResponse.json(
        { error: 'Failed to create permission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
