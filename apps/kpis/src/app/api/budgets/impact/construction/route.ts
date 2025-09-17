import { NextRequest, NextResponse } from "next/server";
import { calculateConstructionBudgetImpact } from "@/lib/odoo/services";
import { invoicePermissionService } from "@/lib/services/invoicePermissions";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, spendCategoryId, invoiceAmount, sessionApprovedAmount = 0 } = body;

    if (!projectId || !spendCategoryId || !invoiceAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, spendCategoryId, invoiceAmount' },
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

    // Calculate construction budget impact
    const budgetImpact = await calculateConstructionBudgetImpact(
      projectId,
      spendCategoryId,
      invoiceAmount,
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
