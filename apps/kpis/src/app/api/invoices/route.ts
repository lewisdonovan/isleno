import { NextRequest, NextResponse } from 'next/server';
import { getAllInvoices } from '@/lib/odoo/services';
import { getCurrentUserInvoiceAlias } from '@/lib/odoo/utils';
import { isZeroValueInvoice } from '@/lib/utils/invoiceUtils';

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
    const result = await getAllInvoices(alias || undefined);
    
    // Helper function to extract data from result (handles both old and new formats)
    const extractResultData = (result: any) => {
      if (Array.isArray(result)) {
        return {
          invoices: result,
          ocrRefreshPerformed: false,
          zeroValueInvoicesRefreshed: 0,
          zeroValueInvoiceIds: []
        };
      }
      
      return {
        invoices: result.invoices,
        ocrRefreshPerformed: result.ocrRefreshPerformed ?? false,
        zeroValueInvoicesRefreshed: result.zeroValueInvoicesRefreshed ?? 0,
        zeroValueInvoiceIds: result.zeroValueInvoiceIds ?? []
      };
    };

    const { invoices, ocrRefreshPerformed, zeroValueInvoicesRefreshed, zeroValueInvoiceIds } = extractResultData(result);
    
    // Count zero-value invoices after refresh
    const zeroValueCount = invoices.filter(isZeroValueInvoice).length;
    
    return NextResponse.json({
      invoices,
      metadata: {
        totalInvoices: invoices.length,
        zeroValueInvoicesAfterRefresh: zeroValueCount,
        zeroValueInvoicesRefreshed,
        ocrRefreshPerformed,
        zeroValueInvoiceIds
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 