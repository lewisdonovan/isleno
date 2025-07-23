import { NextResponse } from 'next/server';
import { getPendingInvoices } from '@/lib/odoo/services';

export async function GET() {
  try {
    const invoices = await getPendingInvoices();
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 