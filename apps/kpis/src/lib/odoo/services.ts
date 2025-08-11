import { odooApi } from "./api";
import { ODOO_MAIN_COMPANY_ID } from "../constants/odoo";

const INVOICE_MODEL = 'account.move';
const SUPPLIER_MODEL = 'res.partner';
const ATTACHMENT_MODEL = 'ir.attachment';
const PROJECT_MODEL = 'account.analytic.account';

export async function getPendingInvoices(invoiceApprovalAlias?: string) {
    
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["x_studio_project_manager_review_status", "=", "pending"],
        ["amount_untaxed", ">", 0]  // Exclude invoices with zero subtotal (OCR not complete)
    ];

    // Add user-specific filtering if invoice_approval_alias is provided
    if (invoiceApprovalAlias) {
        domain.push(["x_studio_project_manager_1", "=", invoiceApprovalAlias]);
    }

    const fields = [
        "id",
        "partner_id",
        "invoice_date",
        "invoice_date_due",
        "amount_untaxed", 
        "currency_id",
        "x_studio_project_manager_1", // Include the project manager field for verification
        "invoice_line_ids" // Include line items for project assignment
    ];

    const invoices = await odooApi.searchRead(INVOICE_MODEL, domain, { fields });

    // Fetch attachments for each invoice
    for (const invoice of invoices) {
        const attachmentDomain = [
            ["res_model", "=", INVOICE_MODEL],
            ["res_id", "=", invoice.id],
        ];
        const attachmentFields = ["id", "name", "mimetype", "datas"];
        const attachments = await odooApi.searchRead(ATTACHMENT_MODEL, attachmentDomain, { fields: attachmentFields });
        invoice.attachments = attachments;
    }

    return invoices;
}

export async function getSuppliers() {
    const fields = ["id", "name", "x_studio_accounting_code"];
    return odooApi.searchRead(SUPPLIER_MODEL, [], { fields });
}

export async function getProjects() {
    
    const domain = [
        ["active", "=", true],
        ["name", "!=", false], // Ensure name is not false/null
        ["name", "!=", ""],     // Ensure name is not empty string
    ];
    const fields = ["id", "name", "code"];
    const kwargs = {
        order: "name asc", // Order by name to ensure consistent results
        limit: 1000        // Add reasonable limit to prevent excessive data
    };
    
    console.log('Odoo projects query domain:', domain);
    console.log('Odoo projects query kwargs:', kwargs);
    
    const projects = await odooApi.searchRead(PROJECT_MODEL, domain, { fields, ...kwargs });
    
    console.log('Raw Odoo projects response count:', projects.length);
    
    // Additional deduplication on the backend as a safety measure
    const uniqueProjects = projects.reduce((acc: any[], project: any) => {
        const existingProject = acc.find(p => p.id === project.id);
        if (!existingProject) {
            acc.push(project);
        } else {
            console.log('Backend duplicate project found:', project);
        }
        return acc;
    }, []);
    
    console.log('Backend deduplicated projects count:', uniqueProjects.length);
    
    return uniqueProjects;
}

export async function getSpendCategories() {
    const ACCOUNT_MODEL = 'account.account';
    
    // Filter for expense accounts that are marked as visible to project managers
    // Note: account.account model may not have 'active' field, so we'll filter by code instead
    const domain = [
        ["x_studio_show_to_pm_mostrar_a_pm", "=", true],  // Only show categories marked for PM visibility
    ];
    
    const fields = ["id", "name", "code"];
    const kwargs = {
        order: "name asc",
        limit: 1000
    };
    
    console.log('Odoo spend categories query domain:', domain);
    const categories = await odooApi.searchRead(ACCOUNT_MODEL, domain, { fields, ...kwargs });
    
    console.log('Raw Odoo spend categories response count:', categories.length);
    return categories;
}

export async function updateInvoice(invoiceId: number, data: any) {
    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
}

export async function approveInvoice(invoiceId: number, projectId?: number, accountingCode?: string) {
    const data: any = {
        "x_studio_project_manager_review_status": "approved"
    };

    // If project is selected, update the analytic account on line items
    if (projectId) {
        try {
            
            // Get invoice line items
            const invoice = await odooApi.searchRead(INVOICE_MODEL, [
                ['id', '=', invoiceId]
            ], {
                fields: ['invoice_line_ids']
            });
            
            if (invoice.length > 0 && invoice[0].invoice_line_ids) {
                // Update each line item with the selected project
                for (const lineId of invoice[0].invoice_line_ids) {
                    await odooApi.write('account.move.line', [lineId], {
                        'analytic_account_id': projectId
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update line items with project:', error);
            // Continue with approval even if project update fails
        }
    }

    // Note: Accounting code update is temporarily disabled due to field not existing
    // If accounting code is provided, we'll need to implement this differently
    // For now, we'll just log it for future implementation
    if (accountingCode) {
        console.log(`Accounting code ${accountingCode} selected for invoice ${invoiceId} - implementation pending`);
    }

    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
}