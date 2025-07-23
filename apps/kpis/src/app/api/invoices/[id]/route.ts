import { NextRequest, NextResponse } from 'next/server';
import { updateInvoice } from '@/lib/odoo/services';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id, 10);
    const body = await request.json();
    await updateInvoice(invoiceId, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to update invoice ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 