import { NextRequest, NextResponse } from "next/server";
import { calculateDepartmentBudgetImpact } from "@/lib/odoo/services";
import { invoicePermissionService } from "@/lib/services/invoicePermissions";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId, departmentName, invoiceAmount, invoiceIssueDate, sessionApprovedAmount = 0 } = body;

    if (!departmentId || !departmentName || !invoiceAmount || !invoiceIssueDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: departmentId, departmentName, invoiceAmount, invoiceIssueDate' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has budget view permissions
    const { canView } = await invoicePermissionService.getInvoiceAccessLevel(user.id);

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate department budget impact
    const budgetImpact = await calculateDepartmentBudgetImpact(
      departmentId,
      departmentName,
      invoiceAmount,
      invoiceIssueDate,
      sessionApprovedAmount
    );

    if (!budgetImpact) {
      return NextResponse.json(
        { error: 'Budget impact calculation failed' },
        { status: 404 }
      );
    }

    return NextResponse.json(budgetImpact);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
