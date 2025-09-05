import { odooApi } from "./api";
import { ODOO_MAIN_COMPANY_ID } from "../constants/odoo";
import { createClient } from '@supabase/supabase-js';
import { isZeroValueInvoice } from "../utils/invoiceUtils";
import { ocrNotificationService } from "../services/ocrNotificationService";

const INVOICE_MODEL = 'account.move';
const SUPPLIER_MODEL = 'res.partner';
const ATTACHMENT_MODEL = 'ir.attachment';
const PROJECT_MODEL = 'account.analytic.account';
const ACCOUNT_MODEL = 'account.account';
const LINE_ITEM_MODEL = 'account.move.line';

export async function getInvoice(invoiceId: number) {
    const domain = [
        ["id", "=", invoiceId],
        ["move_type", "=", "in_invoice"]
    ];

    const fields = [
        "id",
        "partner_id",
        "invoice_date",
        "invoice_date_due",
        "amount_untaxed", 
        "currency_id",
        "x_studio_project_manager_review_status",
        "state",
        "name"
    ];

    const invoices = await odooApi.searchRead(INVOICE_MODEL, domain, { fields });
    
    if (invoices.length === 0) {
        return null;
    }

    const invoice = invoices[0];

    // Fetch attachments for this invoice
    const attachmentDomain = [
        ["res_model", "=", INVOICE_MODEL],
        ["res_id", "=", invoice.id],
    ];
    const attachmentFields = ["id", "name", "mimetype", "datas"];
    const attachments = await odooApi.searchRead(ATTACHMENT_MODEL, attachmentDomain, { fields: attachmentFields });
    invoice.attachments = attachments;

    return invoice;
}

export async function getPendingInvoices(invoiceApprovalAlias?: string) {
    
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["x_studio_project_manager_review_status", "=", "pending"],
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

export async function getAllInvoices(invoiceApprovalAlias?: string, skipOcrRefresh: boolean = false) {
    
    const domain = [
        ["move_type", "=", "in_invoice"]
        // Remove the status filter to get all invoices
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
        "x_studio_project_manager_review_status",
        "state",
        "name",
        "x_studio_is_over_budget",
        "x_studio_amount_over_budget",
        "x_studio_cfo_sign_off",
        "x_studio_ceo_sign_off"
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

    // Identify zero-value invoices
    const zeroValueInvoices = invoices.filter(isZeroValueInvoice);

    // If OCR refresh is enabled and there are zero-value invoices, start background refresh
    if (!skipOcrRefresh && zeroValueInvoices.length > 0) {
        const invoiceIds = zeroValueInvoices.map(inv => inv.id);
        
        // Notify that OCR refresh is starting
        ocrNotificationService.startRefresh(invoiceIds);
        
        // Start background OCR refresh without blocking the response
        refreshOcrDataForInvoices(invoiceIds)
            .then(result => {
                ocrNotificationService.completeRefresh(result);
            })
            .catch(error => {
                console.error('Background OCR refresh failed:', error);
                ocrNotificationService.failRefresh(error instanceof Error ? error.message : 'Unknown error');
            });
    }

    return {
        invoices,
        ocrRefreshPerformed: !skipOcrRefresh && zeroValueInvoices.length > 0,
        zeroValueInvoicesRefreshed: zeroValueInvoices.length,
        zeroValueInvoiceIds: zeroValueInvoices.map(inv => inv.id)
    };
}

/**
 * Background function to refresh OCR data for zero-value invoices
 * This runs asynchronously and doesn't block the main response
 */
async function refreshOcrDataForInvoices(invoiceIds: number[]) {
    console.log(`Starting background OCR refresh for ${invoiceIds.length} invoices...`);
    
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];
        try {
            await odooApi.executeKw(
                'account.move',
                'action_reload_ai_data',
                [[invoiceId]]
            );
            console.log(`Successfully refreshed OCR data for invoice ${invoiceId}`);
            results.push({ invoiceId, success: true, error: null });
        } catch (error) {
            console.error(`Failed to refresh OCR data for invoice ${invoiceId}:`, error);
            results.push({ 
                invoiceId, 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            });
        }
        
        // Update progress after each invoice
        ocrNotificationService.updateProgress(i + 1, invoiceIds.length);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Background OCR refresh completed in ${duration}ms: ${successful}/${invoiceIds.length} successful, ${failed} failed`);
    
    // Log detailed results for debugging
    if (failed > 0) {
        const failedInvoices = results.filter(r => !r.success);
        console.log('Failed invoices:', failedInvoices.map(r => ({ id: r.invoiceId, error: r.error })));
    }
    
    return {
        totalInvoices: invoiceIds.length,
        successful,
        failed,
        duration,
        results,
        completedAt: new Date().toISOString()
    };
}

export async function getAwaitingApprovalInvoices(invoiceApprovalAlias?: string) {
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["x_studio_project_manager_review_status", "=", "approved"],
        ["x_studio_is_over_budget", "=", true],
        "|",
        ["x_studio_cfo_sign_off", "=", false],
        "&",
        ["x_studio_amount_over_budget", ">=", 3000],
        ["x_studio_ceo_sign_off", "=", false]
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
        "x_studio_project_manager_review_status",
        "x_studio_is_over_budget",
        "x_studio_amount_over_budget",
        "x_studio_cfo_sign_off",
        "x_studio_ceo_sign_off",
        "state",
        "name"
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

export async function getSentForPaymentInvoices(invoiceApprovalAlias?: string) {
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["state", "=", "posted"]
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
        "x_studio_project_manager_review_status",
        "state",
        "name"
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

export async function getPaidInvoices(invoiceApprovalAlias?: string) {
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["state", "=", "paid"]
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
        "x_studio_project_manager_review_status",
        "state",
        "name"
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

export async function getOtherInvoices(invoiceApprovalAlias?: string) {
    const domain = [
        ["move_type", "=", "in_invoice"],
        "!",
        ["x_studio_project_manager_review_status", "=", "pending"],
        "!",
        ["x_studio_project_manager_review_status", "=", "approved"],
        "!",
        ["state", "=", "posted"],
        "!",
        ["state", "=", "paid"]
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
        "x_studio_project_manager_review_status",
        "state",
        "name"
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
        ["name", "!=", false], 
        ["name", "!=", ""],
        ["plan_id.name", "=", "Project"], // Projects only
    ];
    const fields = ["id", "name", "code", "plan_id"];
    const kwargs = {
        order: "name asc", // Order by name to ensure consistent results
        limit: 1000        // Add reasonable limit to prevent excessive data
    };
    
    const projects = await odooApi.searchRead(PROJECT_MODEL, domain, { fields, ...kwargs });
    
    return projects;
}

export async function getSpendCategories() {
        
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
    
    const categories = await odooApi.searchRead(ACCOUNT_MODEL, domain, { fields, ...kwargs });
    
    return categories;
}

export async function getCurrentUserProfile(userId: string) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user profile with department information
        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
                *,
                departments!inner(
                    department_id,
                    department_name,
                    odoo_group_id
                )
            `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return { profile: null, department: null, error: error.message };
        }

        return { 
            profile, 
            department: profile?.departments || null,
            error: null 
        };
    } catch (error) {
        console.error('Error in getCurrentUserProfile:', error);
        return { profile: null, department: null, error: 'Failed to fetch user profile' };
    }
}

export async function updateInvoice(invoiceId: number, data: any) {
    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
}

export async function approveInvoice(invoiceId: number, departmentId?: number, projectId?: number, accountingCode?: string) {
    const data: any = {
        "x_studio_project_manager_review_status": "approved"
    };

    // Get non-tax line items for this invoice
    try {
        // First, let's test what fields are available and see the accounting codes
        const lineItems = await odooApi.searchRead(LINE_ITEM_MODEL, [
            ["move_id", "=", invoiceId], 
            ["tax_line_id", "=", false]  // Filter out tax lines
        ], {
            fields: ['id', 'account_id', 'account_code', 'name', 'debit', 'credit']
        });

        if (lineItems.length > 0) {
            // Filter for lines where accounting code starts with "6" (expense accounts)
            const expenseLines = lineItems.filter((line: any) => {
                // Try different possible field names for accounting code
                const accountCode = line.account_code || line.account_id?.[2] || line.account_id?.[1];
                
                if (accountCode && typeof accountCode === 'string' && accountCode.startsWith('6')) {
                    return true;
                }
                return false;
            });

            if (expenseLines.length > 0) {
                const lineIds = expenseLines.map((line: any) => line.id);
                
                // Prepare update data for line items
                const updateData: Record<string, any> = {};
                
                if (accountingCode && accountingCode.trim() !== '') {
                    // The accountingCode parameter is the account_code string (e.g., '62700022')
                    // We need to find the actual account_id that corresponds to this account_code
                    // Let's fetch the account record by code to get its ID
                    try {
                        const accountRecord = await odooApi.searchRead(ACCOUNT_MODEL, [
                            ["code", "=", accountingCode]
                        ], {
                            fields: ["id"]
                        });
                        
                        if (accountRecord && accountRecord.length > 0) {
                            // Update both account_id and account_code
                            updateData['account_id'] = accountRecord[0].id;
                            updateData['account_code'] = accountingCode;
                        } else {
                            console.warn(`No account found with code: ${accountingCode}`);
                            // Still update account_code even if we can't find the account_id
                            updateData['account_code'] = accountingCode;
                        }
                    } catch (error) {
                        console.error('Failed to fetch account by code:', error);
                        // Fallback: just update account_code
                        updateData['account_code'] = accountingCode;
                    }
                }
                
                // Handle project allocation based on department selection
                if (departmentId) {
                    if (projectId) {
                        // If both department and project are selected, allocate 100% to the project
                        updateData['analytic_distribution'] = {
                            [projectId.toString()]: 100.0
                        };
                    } else {
                        // If only department is selected, allocate 100% to the department
                        updateData['analytic_distribution'] = {
                            [departmentId.toString()]: 100.0
                        };
                    }
                }

                // Update line items in a single write call if there's data to update
                if (Object.keys(updateData).length > 0) {
                    try {
                        await odooApi.write(LINE_ITEM_MODEL, lineIds, updateData);
                    } catch (error) {
                        console.error('Failed to update expense line items:', error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Failed to get or update line items:', error);
        // Continue with approval even if line item updates fail
    }

    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
}