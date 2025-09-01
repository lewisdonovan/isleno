/**
 * Utility functions for invoice processing
 */

/**
 * Checks if an invoice has a zero or null/undefined untaxed amount
 * @param invoice - The invoice object to check
 * @returns true if the invoice has zero or null/undefined amount_untaxed
 */
export function isZeroValueInvoice(invoice: { amount_untaxed?: number | null }): boolean {
  return !invoice.amount_untaxed || invoice.amount_untaxed === 0;
}

/**
 * Gets the status badge variant and text for an invoice state
 * @param state - The invoice state
 * @returns object with variant and text for the badge
 */
export function getStatusBadgeInfo(state?: string): { variant: "default" | "secondary" | "destructive" | "outline", text: string } {
  switch (state) {
    case 'draft':
      return { variant: "secondary", text: "Draft" };
    case 'open':
      return { variant: "destructive", text: "Action Required" };
    case 'posted':
      return { variant: "secondary", text: "Awaiting Approval" };
    case 'sent':
      return { variant: "default", text: "Sent for Payment" };
    case 'paid':
      return { variant: "default", text: "Paid" };
    default:
      return { variant: "outline", text: "Unknown" };
  }
}
