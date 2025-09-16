/**
 * Budget Session Service
 * Manages session-based budget tracking without database storage
 * Uses browser sessionStorage to track approved invoices and running totals
 */

import { SessionBudgetState, BudgetImpact } from '@isleno/types/odoo';

const SESSION_STORAGE_KEY = 'budget_session_state';

export class BudgetSessionService {
  private sessionId: string;
  private state: SessionBudgetState;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.state = this.loadFromStorage() || this.createNewSession();
  }

  private generateSessionId(): string {
    return `budget_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createNewSession(): SessionBudgetState {
    return {
      sessionId: this.sessionId,
      approvedInvoices: [],
      budgetImpacts: new Map()
    };
  }

  private loadFromStorage(): SessionBudgetState | null {
    if (typeof window === 'undefined') {
      return null; // SSR safety
    }

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert budgetImpacts back to Map
        parsed.budgetImpacts = new Map(Object.entries(parsed.budgetImpacts || {}));
        return parsed;
      }
    } catch (error) {
      console.error('Error loading budget session from storage:', error);
    }
    return null;
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return; // SSR safety
    }

    try {
      // Convert Map to object for JSON serialization
      const stateToStore = {
        ...this.state,
        budgetImpacts: Object.fromEntries(this.state.budgetImpacts)
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Error saving budget session to storage:', error);
    }
  }

  /**
   * Add an approved invoice to the session
   */
  addApprovedInvoice(invoiceId: number, amount: number, projectId?: number, departmentId?: number): void {
    const invoice = {
      invoiceId,
      amount,
      projectId,
      departmentId,
      timestamp: new Date()
    };

    this.state.approvedInvoices.push(invoice);
    this.saveToStorage();
  }

  /**
   * Get total approved amount for a specific analytic account in this session
   */
  getSessionApprovedAmount(analyticAccountId: number): number {
    return this.state.approvedInvoices
      .filter(invoice => 
        invoice.projectId === analyticAccountId || 
        invoice.departmentId === analyticAccountId
      )
      .reduce((total, invoice) => total + invoice.amount, 0);
  }

  /**
   * Store budget impact calculation for an analytic account
   */
  setBudgetImpact(analyticAccountId: number, impact: BudgetImpact): void {
    this.state.budgetImpacts.set(analyticAccountId, impact);
    this.saveToStorage();
  }

  /**
   * Get stored budget impact for an analytic account
   */
  getBudgetImpact(analyticAccountId: number): BudgetImpact | undefined {
    return this.state.budgetImpacts.get(analyticAccountId);
  }

  /**
   * Get all approved invoices in this session
   */
  getApprovedInvoices(): Array<{
    invoiceId: number;
    amount: number;
    projectId?: number;
    departmentId?: number;
    timestamp: Date;
  }> {
    return [...this.state.approvedInvoices];
  }

  /**
   * Check if an invoice has already been approved in this session
   */
  isInvoiceApproved(invoiceId: number): boolean {
    return this.state.approvedInvoices.some(invoice => invoice.invoiceId === invoiceId);
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.state = this.createNewSession();
    this.saveToStorage();
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionId: string;
    totalApprovedInvoices: number;
    totalApprovedAmount: number;
    uniqueAnalyticAccounts: number;
  } {
    const totalAmount = this.state.approvedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const uniqueAccounts = new Set();
    
    this.state.approvedInvoices.forEach(invoice => {
      if (invoice.projectId) uniqueAccounts.add(invoice.projectId);
      if (invoice.departmentId) uniqueAccounts.add(invoice.departmentId);
    });

    return {
      sessionId: this.state.sessionId,
      totalApprovedInvoices: this.state.approvedInvoices.length,
      totalApprovedAmount: totalAmount,
      uniqueAnalyticAccounts: uniqueAccounts.size
    };
  }
}

// Export singleton instance
export const budgetSessionService = new BudgetSessionService();