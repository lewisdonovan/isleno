import { NextRequest, NextResponse } from 'next/server';
import { getSpendCategories } from '@/lib/odoo/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching spend categories from Odoo...');
    const categories = await getSpendCategories();
    console.log('Spend categories fetched from Odoo:', categories.length, 'categories');
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Failed to fetch spend categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
