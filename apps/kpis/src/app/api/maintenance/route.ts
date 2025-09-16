import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/maintenance - Get current maintenance status
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current maintenance status
    const { data: maintenanceActive, error: statusError } = await supabase.rpc('is_maintenance_active')
    
    if (statusError) {
      console.error('Error checking maintenance status:', statusError)
      return NextResponse.json({ error: 'Failed to check maintenance status' }, { status: 500 })
    }

    let maintenanceInfo = null
    if (maintenanceActive) {
      const { data: currentMaintenance, error: infoError } = await supabase.rpc('get_current_maintenance')
      
      if (infoError) {
        console.error('Error getting maintenance info:', infoError)
        return NextResponse.json({ error: 'Failed to get maintenance info' }, { status: 500 })
      }
      
      maintenanceInfo = currentMaintenance?.[0] || null
    }

    return NextResponse.json({
      isActive: maintenanceActive,
      maintenanceInfo
    })
  } catch (error) {
    console.error('Error in maintenance GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/maintenance - Create new maintenance window
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { startTime, endTime, reason } = body

    // Validate required fields
    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start time and end time are required' }, { status: 400 })
    }

    // Validate time range
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Check if there's already an active maintenance window
    const { data: existingActive } = await supabase
      .from('maintenance_status')
      .select('id')
      .eq('is_active', true)
      .single()

    if (existingActive) {
      return NextResponse.json({ error: 'There is already an active maintenance window' }, { status: 409 })
    }

    // Create new maintenance window
    const { data: newMaintenance, error: createError } = await supabase
      .from('maintenance_status')
      .insert({
        is_active: true,
        start_time: startTime,
        end_time: endTime,
        reason: reason || null,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating maintenance window:', createError)
      return NextResponse.json({ error: 'Failed to create maintenance window' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      maintenance: newMaintenance
    })
  } catch (error) {
    console.error('Error in maintenance POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/maintenance - End current maintenance window
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // End current maintenance window
    const { data: updatedMaintenance, error: updateError } = await supabase
      .from('maintenance_status')
      .update({ is_active: false })
      .eq('is_active', true)
      .select()
      .single()

    if (updateError) {
      console.error('Error ending maintenance window:', updateError)
      return NextResponse.json({ error: 'Failed to end maintenance window' }, { status: 500 })
    }

    if (!updatedMaintenance) {
      return NextResponse.json({ error: 'No active maintenance window found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Maintenance window ended successfully'
    })
  } catch (error) {
    console.error('Error in maintenance DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
