import { NextRequest, NextResponse } from 'next/server';
import { approveInvoice } from '@/lib/odoo/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id, 10);
    await approveInvoice(invoiceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to approve invoice ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 