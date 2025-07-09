import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { fetchDevelopmentProjects } from '@/lib/monday/services';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const authResult = validateSession(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const data = await fetchDevelopmentProjects(authResult.session!);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching development projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch development projects' },
      { status: 500 }
    );
  }
} 