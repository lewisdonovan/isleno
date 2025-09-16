import * as en from '../../../messages/en.json'
import * as es from '../../../messages/es.json';

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
export function getStatusBadgeInfo(state?: string, locale = "en"): { variant: "default" | "secondary" | "destructive" | "outline", text: string } {
  const messages = locale === "en" ? en : es;
  switch (state) {
    case 'draft':
      return { variant: "secondary", text: locale === "en" ? "Draft" : "Borrador" };
    case 'open':
      return { variant: "destructive", text: messages.invoices.actionRequired };
    case 'posted':
      return { variant: "secondary", text: messages.invoices.status.awaitingApproval };
    case 'sent':
      return { variant: "default", text: messages.invoices.status.sentForPayment };
    case 'paid':
      return { variant: "default", text: messages.invoices.status.paid };
    default:
      return { variant: "outline", text: messages.invoices.status.other };
  }
}
