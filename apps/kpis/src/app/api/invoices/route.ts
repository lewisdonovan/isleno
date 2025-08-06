import { NextRequest, NextResponse } from 'next/server';
import { getPendingInvoices } from '@/lib/odoo/services';
import { getCurrentUserInvoiceAlias } from '@/lib/odoo/utils';

export async function GET(_request: NextRequest) {
  try {
    // Get current user's invoice approval alias
    const { alias, error } = await getCurrentUserInvoiceAlias();

    if (error) {
      const statusCode = error === 'Unauthorized' ? 401 : 500;
      return NextResponse.json({ error }, { status: statusCode });
    }

    // Get invoices filtered by user's invoice_approval_alias
    const invoices = await getPendingInvoices(alias || undefined);
    
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 