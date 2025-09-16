import { NextRequest, NextResponse } from "next/server";
import { odooApi } from "@/lib/odoo/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const departmentId = searchParams.get('departmentId');
    
    if (!projectId && !departmentId) {
      return NextResponse.json({ error: "Either projectId or departmentId is required" }, { status: 400 });
    }

    // Build domain for budget query
    const domain: any[] = [];
    
    // The account.report.budget model stores budget information
    // We'll need to filter by analytic_account_id (which is the project/department)
    if (projectId) {
      domain.push(["analytic_account_id", "=", parseInt(projectId)]);
    } else if (departmentId) {
      domain.push(["analytic_account_id", "=", parseInt(departmentId)]);
    }

    // Get current year/period budgets
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Add date filters to get current period budgets
    domain.push(["date_from", "<=", currentDate.toISOString().split('T')[0]]);
    domain.push(["date_to", ">=", currentDate.toISOString().split('T')[0]]);

    // Fields we want to retrieve
    const fields = [
      "id",
      "name",
      "analytic_account_id",
      "date_from", 
      "date_to",
      "planned_amount",
      "practical_amount", // Actual spent amount
      "percentage", // Percentage of budget used
      "residual_amount" // Remaining budget
    ];

    try {
      // First, let's check if the model exists and what fields are available
      const budgets = await odooApi.searchRead("crossovered.budget.lines", domain, { fields });
      
      // Calculate summary data
      const totalBudget = budgets.reduce((sum: number, b: any) => sum + (b.planned_amount || 0), 0);
      const totalSpent = budgets.reduce((sum: number, b: any) => sum + Math.abs(b.practical_amount || 0), 0);
      const remainingBudget = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return NextResponse.json({
        budgets,
        summary: {
          totalBudget,
          totalSpent,
          remainingBudget,
          percentageUsed: Math.round(percentageUsed * 100) / 100
        }
      });
    } catch (error: any) {
      console.error("Budget fetch error:", error);
      
      // If the budget model doesn't exist or we get an error, return a mock response for MVP
      // This allows us to continue development even without proper budget data
      return NextResponse.json({
        budgets: [],
        summary: {
          totalBudget: 100000, // Mock budget
          totalSpent: 45000,   // Mock spent
          remainingBudget: 55000,
          percentageUsed: 45
        },
        mock: true,
        error: error.message || "Budget data not available"
      });
    }
  } catch (error) {
    console.error("Failed to fetch budget data:", error);
    return NextResponse.json({ error: "Failed to fetch budget data" }, { status: 500 });
  }
}