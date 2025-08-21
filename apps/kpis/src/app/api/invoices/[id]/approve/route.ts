import { NextRequest, NextResponse } from 'next/server';
import { approveInvoice } from '@/lib/odoo/services';
import { getCurrentUserInvoiceAlias, validateInvoiceAccess } from '@/lib/odoo/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id, 10);
    const body = await request.json();
    const { departmentId, projectId, accountingCode } = body;

    // Get current user's invoice approval alias
    const { alias, error } = await getCurrentUserInvoiceAlias();

    if (error) {
      const statusCode = error === 'Unauthorized' ? 401 : 500;
      return NextResponse.json({ error }, { status: statusCode });
    }

    // Validate that user has access to this specific invoice
    const hasAccess = await validateInvoiceAccess(invoiceId, alias);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied: You can only approve invoices assigned to you' }, { status: 403 });
    }

    await approveInvoice(invoiceId, departmentId, projectId, accountingCode);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to approve invoice ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 