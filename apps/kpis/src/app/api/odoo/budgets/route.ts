import { NextRequest, NextResponse } from 'next/server';
import { getBudgetSummaryByAnalytic } from '@/lib/odoo/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analyticIdParam = searchParams.get('analytic_id');
    if (!analyticIdParam) {
      return NextResponse.json({ error: 'Missing analytic_id' }, { status: 400 });
    }
    const analyticId = parseInt(analyticIdParam, 10);
    if (Number.isNaN(analyticId)) {
      return NextResponse.json({ error: 'Invalid analytic_id' }, { status: 400 });
    }

    const summary = await getBudgetSummaryByAnalytic(analyticId);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Failed to fetch budgets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

