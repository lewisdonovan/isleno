import { NextResponse } from 'next/server';
import { updateInvoice } from '@/lib/odoo/services';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseInt(params.id, 10);
    const body = await request.json();
    await updateInvoice(invoiceId, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to update invoice ${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 