import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { fetchUsers } from '@/lib/monday/services'

export async function GET(request: NextRequest) {
  try {
    const authResult = validateSession(request)
    /*if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      )
    }*/

    const users = await fetchUsers(authResult.session!)
    return NextResponse.json({ data: { users } })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + error },
      { status: 500 }
    )
  }
}
