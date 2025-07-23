import { odooApi } from "./api";

const INVOICE_MODEL = 'account.move';
const SUPPLIER_MODEL = 'res.partner';
const ATTACHMENT_MODEL = 'ir.attachment';

export async function getPendingInvoices() {
    const domain = [
        ["move_type", "=", "in_invoice"],
        ["x_studio_project_manager_review_status", "=", "pending"]
    ];
    const fields = [
        "id",
        "partner_id",
        "invoice_date",
        "invoice_date_due",
        "amount_untaxed", 
        "currency_id"
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
    const fields = ["id", "name"];
    return odooApi.searchRead(SUPPLIER_MODEL, [], { fields });
}

export async function updateInvoice(invoiceId: number, data: any) {
    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
}

export async function approveInvoice(invoiceId: number) {
    const data = {
        "x_studio_project_manager_review_status": "approved"
    };
    return odooApi.write(INVOICE_MODEL, [invoiceId], data);
} 