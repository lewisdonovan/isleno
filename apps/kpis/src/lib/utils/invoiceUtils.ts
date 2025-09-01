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
