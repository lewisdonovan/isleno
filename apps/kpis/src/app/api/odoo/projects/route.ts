import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '@/lib/odoo/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching projects from Odoo...');
    const projects = await getProjects();
    console.log('Projects fetched from Odoo:', projects.length, 'projects');
    console.log('Sample project:', projects[0]);
    
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
