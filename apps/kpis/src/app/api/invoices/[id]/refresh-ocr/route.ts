import { NextRequest, NextResponse } from "next/server";
import { odooApi } from "@/lib/odoo/api";

const INVOICE_MODEL = 'account.move';
const ATTACHMENT_MODEL = 'ir.attachment';

/**
 * Ensure invoice has proper attachment linkage for OCR processing
 * This fixes the "document not found" issue by linking attachments to message_main_attachment_id
 */
async function ensureInvoiceAttachmentLinkage(invoiceId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch the invoice to check message_main_attachment_id
    const invoiceData = await odooApi.searchRead(INVOICE_MODEL, [
      ["id", "=", invoiceId]
    ], {
      fields: ["id", "message_main_attachment_id"]
    });

    if (!invoiceData || invoiceData.length === 0) {
      return { success: false, message: 'Invoice not found' };
    }

    const invoice = invoiceData[0];
    const hasMainAttachment = invoice.message_main_attachment_id && 
                              (Array.isArray(invoice.message_main_attachment_id) ? 
                               invoice.message_main_attachment_id[0] : 
                               invoice.message_main_attachment_id);

    // If message_main_attachment_id is already set, no action needed
    if (hasMainAttachment) {
      return { success: true, message: 'Attachment already linked' };
    }

    // Check if there are any attachments for this invoice
    const attachments = await odooApi.searchRead(ATTACHMENT_MODEL, [
      ["res_model", "=", INVOICE_MODEL],
      ["res_id", "=", invoiceId]
    ], {
      fields: ["id", "name", "mimetype"],
      limit: 1
    });

    if (attachments.length === 0) {
      return { success: false, message: 'No attachment found to link' };
    }

    // Link the first attachment as the main attachment
    const attachmentId = attachments[0].id;
    console.log(`Linking attachment ${attachmentId} to invoice ${invoiceId} as message_main_attachment_id`);
    
    await odooApi.write(INVOICE_MODEL, [invoiceId], {
      message_main_attachment_id: attachmentId
    });

    return { success: true, message: `Linked attachment ${attachmentId}` };
  } catch (error) {
    console.error(`Failed to ensure attachment linkage for invoice ${invoiceId}:`, error);
    return { 
      success: false, 
      message: `Attachment linkage failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

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

    // Step 1: Ensure attachment is properly linked (fixes "document not found" issue)
    const linkageResult = await ensureInvoiceAttachmentLinkage(invoiceId);
    
    if (!linkageResult.success) {
      return NextResponse.json(
        { 
          error: 'Cannot refresh OCR data',
          details: linkageResult.message,
          attachmentLinkage: false
        },
        { status: 400 }
      );
    }

    // Step 2: Call the Odoo API to refresh OCR data for the invoice
    const result = await odooApi.executeKw(
      'account.move',
      'action_reload_ai_data',
      [[invoiceId]]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'OCR data refresh initiated successfully',
      attachmentLinkage: linkageResult.message,
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
