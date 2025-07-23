import { NextResponse } from 'next/server';
import { approveInvoice } from '@/lib/odoo/services';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoiceId = parseInt(params.id, 10);
    await approveInvoice(invoiceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to approve invoice ${params.id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 