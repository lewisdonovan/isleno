import { NextRequest, NextResponse } from 'next/server';
import { hasExternalBasicPermission } from '@/lib/odoo/utils';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const hasPermission = await hasExternalBasicPermission();
    return NextResponse.json({ hasPermission });
  } catch (error: any) {
    console.error("Failed to check external_basic permission:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
