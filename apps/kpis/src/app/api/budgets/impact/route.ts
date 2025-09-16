import { NextRequest, NextResponse } from "next/server";
import { calculateBudgetImpact } from "@/lib/odoo/services";
import { invoicePermissionService } from "@/lib/services/invoicePermissions";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analyticAccountId, invoiceAmount, sessionApprovedAmount = 0 } = body;
    
    if (!analyticAccountId || invoiceAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: analyticAccountId, invoiceAmount' },
        { status: 400 }
      );
    }

    const accountId = parseInt(analyticAccountId, 10);
    const amount = parseFloat(invoiceAmount);
    const sessionAmount = parseFloat(sessionApprovedAmount);
    
    if (isNaN(accountId) || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
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

    // Calculate budget impact
    const budgetImpact = await calculateBudgetImpact(accountId, amount, sessionAmount);

    if (!budgetImpact) {
      return NextResponse.json(
        { error: 'Could not calculate budget impact - budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(budgetImpact);
  } catch (error) {
    console.error('Error calculating budget impact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}