/**
 * Types for Odoo API data models
 */

// Base Odoo record structure
export interface OdooRecord {
  id: number;
}

// res.partner (Suppliers/Vendors)
export interface OdooSupplier extends OdooRecord {
  name: string;
  x_studio_accounting_code?: [number, string];
}

// account.analytic.account (Projects/Departments)
export interface OdooProject extends OdooRecord {
  name: string;
  code?: string;
  plan_id: [number, string];
}

// account.account (Spend Categories/Accounts)
export interface OdooSpendCategory extends OdooRecord {
  name: string;
  code: string;
}

// ir.attachment (File Attachments)
export interface OdooAttachment extends OdooRecord {
  name: string;
  mimetype: string;
  datas: string;
  res_model?: string;
  res_id?: number;
}

// account.move (Invoices)
export interface OdooInvoice extends OdooRecord {
  name?: string;
  partner_id?: [number, string];
  invoice_date?: string;
  invoice_date_due?: string;
  amount_untaxed?: number;
  currency_id?: [number, string];
  x_studio_project_manager_review_status?: string;
  state?: string;
  x_studio_is_over_budget?: boolean;
  x_studio_amount_over_budget?: number;
  x_studio_cfo_sign_off?: boolean;
  x_studio_ceo_sign_off?: boolean;
  x_studio_project_manager_1?: string;
  department_name?: string; // Added by our API
  attachments?: OdooInvoiceAttachment[];
}

// Invoice-specific attachment interface
export interface OdooInvoiceAttachment extends OdooRecord {
  name: string;
  mimetype: string;
  datas: string;
}

// User Profile data from Supabase (related to Odoo integration)
export interface OdooUserProfile {
  id: string;
  full_name?: string;
  job_title?: string;
  department_id?: string;
  odoo_group_id?: number;
  invoice_approval_alias?: string;
  departments?: {
    department_id: string;
    department_name: string;
    odoo_group_id: number;
  };
}

// Generic Odoo API response structure
export interface OdooApiResponse<T> {
  data: T[];
  total?: number;
  error?: string;
}

// Odoo search/read parameters
export interface OdooSearchParams {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

// Odoo domain filter structure
export type OdooDomain = Array<[string, string, any] | string>;

// Pagination information for API responses
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
