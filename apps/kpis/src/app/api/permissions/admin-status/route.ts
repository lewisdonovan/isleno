/**
 * API Route for Admin Status Checking
 * 
 * This endpoint allows checking if the current user has admin role.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverPermissionService } from '@/lib/services/permissions'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/permissions/admin-status - Check if current user is admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await serverPermissionService.isUserAdmin(user.id)

    return NextResponse.json({ 
      isAdmin,
      user_id: user.id
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
