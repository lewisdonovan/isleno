import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    const { data: departments, error } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .order('department_name');

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ departments });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}