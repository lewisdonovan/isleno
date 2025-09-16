import { NextRequest, NextResponse } from "next/server";
import { getBudgetForAnalyticAccount, calculateBudgetImpact } from "@/lib/odoo/services";
import { invoicePermissionService } from "@/lib/services/invoicePermissions";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analyticAccountId: string }> }
) {
  try {
    const { analyticAccountId } = await params;
    const accountId = parseInt(analyticAccountId, 10);
    
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid analytic account ID' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has budget view permissions (same as invoice view for now)
    const { canView } = await invoicePermissionService.getInvoiceAccessLevel(user.id);

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get budget data from Odoo
    const budget = await getBudgetForAnalyticAccount(accountId);

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found for this analytic account' },
        { status: 404 }
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}