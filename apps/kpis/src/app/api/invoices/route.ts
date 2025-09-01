import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoices } from '@/lib/odoo/services';
import { getCurrentUserInvoiceAlias } from '@/lib/odoo/utils';

export async function GET(_request: NextRequest) {
  try {
    // Get current user's invoice approval alias
    const { alias, error } = await getCurrentUserInvoiceAlias();

    if (error) {
      const statusCode = error === 'Unauthorized' ? 401 : 500;
      return NextResponse.json({ error }, { status: statusCode });
    }

    // Get all invoices filtered by user's invoice_approval_alias
    // This will automatically refresh OCR data for zero-value invoices
    const invoices = await getAllInvoices(alias || undefined);
    
    // Count zero-value invoices after refresh
    const zeroValueCount = invoices.filter((invoice: any) => 
        invoice.amount_untaxed === 0 || invoice.amount_untaxed === null || invoice.amount_untaxed === undefined
    ).length;
    
    return NextResponse.json({
      invoices,
      metadata: {
        totalInvoices: invoices.length,
        zeroValueInvoicesAfterRefresh: zeroValueCount,
        ocrRefreshPerformed: zeroValueCount > 0
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 