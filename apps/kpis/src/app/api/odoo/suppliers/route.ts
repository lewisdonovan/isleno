import { NextResponse } from 'next/server';
import { getSuppliers } from '@/lib/odoo/services';

export async function GET() {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 