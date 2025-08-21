import { NextRequest, NextResponse } from 'next/server';
import { getSuppliers } from '@/lib/odoo/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 