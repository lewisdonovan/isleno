import { NextRequest, NextResponse } from 'next/server';
import { odooApi } from '@/lib/odoo/api';
import { isZeroValueInvoice } from '@/lib/utils/invoiceUtils';

const INVOICE_MODEL = 'account.move';

export async function POST(request: NextRequest) {
  try {
    const { invoiceIds } = await request.json();
    
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'Invalid invoice IDs' }, { status: 400 });
    }

    // Fetch current state of the invoices to check if OCR refresh has updated the amounts
    const fields = ["id", "amount_untaxed"];
    const invoices = await odooApi.searchRead(
      INVOICE_MODEL, 
      [['id', 'in', invoiceIds]], 
      { fields }
    );

    // Check which invoices still have zero values (indicating OCR refresh is still needed or failed)
    const stillZeroValue = invoices.filter(isZeroValueInvoice);
    const updatedInvoices = invoices.filter(invoice => !isZeroValueInvoice(invoice));

    return NextResponse.json({
      totalChecked: invoiceIds.length,
      stillZeroValue: stillZeroValue.length,
      updatedInvoices: updatedInvoices.length,
      stillZeroValueIds: stillZeroValue.map(inv => inv.id),
      updatedInvoiceIds: updatedInvoices.map(inv => inv.id)
    });
  } catch (error: any) {
    console.error("Failed to check OCR refresh status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
