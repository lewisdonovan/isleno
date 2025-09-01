import { NextRequest, NextResponse } from "next/server";
import { odooApi } from "@/lib/odoo/api";

export async function POST(
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

    // Call the Odoo API to refresh OCR data for the invoice
    const result = await odooApi.executeKw(
      'account.move',
      'action_reload_ai_data',
      [[invoiceId]]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'OCR data refresh initiated successfully',
      result 
    });
  } catch (error: any) {
    console.error('Failed to refresh OCR data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh OCR data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
