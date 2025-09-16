import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/odoo/services";
import { invoicePermissionService } from "@/lib/services/invoicePermissions";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id, 10);
    
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check invoice access level
    const { canView, accessType, aliases } = await invoicePermissionService.getInvoiceAccessLevel(user.id);

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the invoice data from Odoo
    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // For individual access, verify the invoice belongs to the user
    if (accessType === 'individual' && aliases.length > 0) {
      const userAlias = aliases[0];
      if (invoice.x_studio_project_manager_1 !== userAlias) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // For department access, verify the invoice belongs to someone in the department
    if (accessType === 'department' && aliases.length > 0) {
      if (!invoice.x_studio_project_manager_1 || !aliases.includes(invoice.x_studio_project_manager_1)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Admin and department head access is allowed for all invoices
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 