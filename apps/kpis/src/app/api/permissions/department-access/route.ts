/**
 * API Route for Department-Level Permission Checking
 * 
 * This endpoint allows checking if a user can access department-level resources.
 * It supports both department heads (who get department-level access) and
 * regular users (who get individual permissions).
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// POST /api/permissions/department-access - Check department-level access
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { department_id, resource_type, action } = body

    // Validate required fields
    if (!department_id || !resource_type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: department_id, resource_type, action' },
        { status: 400 }
      )
    }

    // Check department-level access
    const hasAccess = await serverPermissionService.canAccessDepartmentResources(
      user.id,
      department_id,
      resource_type as any,
      action as any
    )

    return NextResponse.json({ 
      hasAccess,
      user_id: user.id,
      department_id,
      resource_type,
      action
    })
  } catch (error) {
    console.error('Error checking department access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
