import { NextRequest, NextResponse } from "next/server";
import { odooApi } from "@/lib/odoo/api";

const INVOICE_MODEL = 'account.move';
const ATTACHMENT_MODEL = 'ir.attachment';

/**
 * Fix attachment linkage for multiple invoices
 * This endpoint can be used to retroactively fix invoices that have the "document not found" issue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceIds } = body;

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: invoiceIds array is required' },
        { status: 400 }
      );
    }

    console.log(`Starting attachment linkage fix for ${invoiceIds.length} invoices`);
    
    const results = [];
    
    for (const invoiceId of invoiceIds) {
      try {
        // Fetch the invoice to check message_main_attachment_id
        const invoiceData = await odooApi.searchRead(INVOICE_MODEL, [
          ["id", "=", invoiceId]
        ], {
          fields: ["id", "message_main_attachment_id", "name"]
        });

        if (!invoiceData || invoiceData.length === 0) {
          results.push({
            invoiceId,
            success: false,
            action: 'not_found',
            message: 'Invoice not found'
          });
          continue;
        }

        const invoice = invoiceData[0];
        const hasMainAttachment = invoice.message_main_attachment_id && 
                                  (Array.isArray(invoice.message_main_attachment_id) ? 
                                   invoice.message_main_attachment_id[0] : 
                                   invoice.message_main_attachment_id);

        // If message_main_attachment_id is already set, skip
        if (hasMainAttachment) {
          results.push({
            invoiceId,
            success: true,
            action: 'already_linked',
            message: 'Attachment already linked'
          });
          continue;
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
          results.push({
            invoiceId,
            success: false,
            action: 'no_attachment',
            message: 'No attachment found to link'
          });
          continue;
        }

        // Link the first attachment as the main attachment
        const attachmentId = attachments[0].id;
        
        await odooApi.write(INVOICE_MODEL, [invoiceId], {
          message_main_attachment_id: attachmentId
        });

        results.push({
          invoiceId,
          success: true,
          action: 'linked',
          message: `Successfully linked attachment ${attachmentId}`,
          attachmentId
        });
        
        console.log(`✓ Linked attachment ${attachmentId} to invoice ${invoiceId}`);
      } catch (error) {
        console.error(`✗ Failed to fix attachment for invoice ${invoiceId}:`, error);
        results.push({
          invoiceId,
          success: false,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const linked = results.filter(r => r.action === 'linked').length;
    const alreadyLinked = results.filter(r => r.action === 'already_linked').length;
    const noAttachment = results.filter(r => r.action === 'no_attachment').length;

    console.log(`Attachment linkage fix completed: ${linked} newly linked, ${alreadyLinked} already linked, ${noAttachment} without attachments, ${failed - noAttachment} errors`);

    return NextResponse.json({ 
      success: true,
      summary: {
        total: invoiceIds.length,
        successful,
        failed,
        linked,
        alreadyLinked,
        noAttachment
      },
      results
    });
  } catch (error: any) {
    console.error('Failed to fix attachments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix attachments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Fix attachment linkage for ALL invoices with zero values
 * This endpoint scans all invoices and fixes those that need it
 */
export async function GET() {
  try {
    console.log('Starting automatic attachment linkage fix for all zero-value invoices');

    // Find all invoices with zero or null amount_untaxed
    const invoices = await odooApi.searchRead(INVOICE_MODEL, [
      ["move_type", "=", "in_invoice"],
      "|",
      ["amount_untaxed", "=", 0],
      ["amount_untaxed", "=", false]
    ], {
      fields: ["id", "name", "amount_untaxed"],
      limit: 100 // Process max 100 at a time to avoid timeouts
    });

    if (invoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No zero-value invoices found',
        summary: { total: 0, successful: 0, failed: 0, linked: 0, alreadyLinked: 0, noAttachment: 0 },
        results: []
      });
    }

    console.log(`Found ${invoices.length} zero-value invoices to check`);

    const results = [];
    
    for (const invoice of invoices) {
      const invoiceId = invoice.id;
      try {
        // Check message_main_attachment_id
        const hasMainAttachment = invoice.message_main_attachment_id && 
                                  (Array.isArray(invoice.message_main_attachment_id) ? 
                                   invoice.message_main_attachment_id[0] : 
                                   invoice.message_main_attachment_id);

        if (hasMainAttachment) {
          results.push({
            invoiceId,
            success: true,
            action: 'already_linked',
            message: 'Attachment already linked'
          });
          continue;
        }

        // Check if there are any attachments
        const attachments = await odooApi.searchRead(ATTACHMENT_MODEL, [
          ["res_model", "=", INVOICE_MODEL],
          ["res_id", "=", invoiceId]
        ], {
          fields: ["id", "name", "mimetype"],
          limit: 1
        });

        if (attachments.length === 0) {
          results.push({
            invoiceId,
            success: false,
            action: 'no_attachment',
            message: 'No attachment found'
          });
          continue;
        }

        // Link the attachment
        const attachmentId = attachments[0].id;
        
        await odooApi.write(INVOICE_MODEL, [invoiceId], {
          message_main_attachment_id: attachmentId
        });

        results.push({
          invoiceId,
          success: true,
          action: 'linked',
          message: `Linked attachment ${attachmentId}`,
          attachmentId
        });

        console.log(`✓ Fixed invoice ${invoiceId} (${invoice.name})`);
      } catch (error) {
        console.error(`✗ Failed to fix invoice ${invoiceId}:`, error);
        results.push({
          invoiceId,
          success: false,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const linked = results.filter(r => r.action === 'linked').length;
    const alreadyLinked = results.filter(r => r.action === 'already_linked').length;
    const noAttachment = results.filter(r => r.action === 'no_attachment').length;

    console.log(`Automatic fix completed: ${linked} newly linked, ${alreadyLinked} already linked, ${noAttachment} without attachments, ${failed - noAttachment} errors`);

    return NextResponse.json({ 
      success: true,
      message: `Processed ${invoices.length} zero-value invoices`,
      summary: {
        total: invoices.length,
        successful,
        failed,
        linked,
        alreadyLinked,
        noAttachment
      },
      results
    });
  } catch (error: any) {
    console.error('Failed to run automatic attachment fix:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run automatic attachment fix',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

