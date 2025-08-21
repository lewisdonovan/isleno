import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/odoo/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const projects = await getProjects();
    
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
