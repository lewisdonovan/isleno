'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BudgetImpact } from '@isleno/types/odoo';
import { budgetSessionService } from '@/lib/services/budgetSessionService';

interface BudgetContextType {
  budgetImpacts: Map<number, BudgetImpact>;
  sessionStats: {
    sessionId: string;
    totalApprovedInvoices: number;
    totalApprovedAmount: number;
    uniqueAnalyticAccounts: number;
  };
  
  // Actions
  calculateBudgetImpact: (analyticAccountId: number, invoiceAmount: number) => Promise<BudgetImpact | null>;
  addApprovedInvoice: (invoiceId: number, amount: number, projectId?: number, departmentId?: number) => void;
  getBudgetImpact: (analyticAccountId: number) => BudgetImpact | undefined;
  getSessionApprovedAmount: (analyticAccountId: number) => number;
  isInvoiceApproved: (invoiceId: number) => boolean;
  clearSession: () => void;
  refreshSessionStats: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgetImpacts, setBudgetImpacts] = useState<Map<number, BudgetImpact>>(new Map());
  const [sessionStats, setSessionStats] = useState(() => budgetSessionService.getSessionStats());

  const refreshSessionStats = useCallback(() => {
    setSessionStats(budgetSessionService.getSessionStats());
  }, []);

  const calculateBudgetImpact = useCallback(async (
    analyticAccountId: number, 
    invoiceAmount: number
  ): Promise<BudgetImpact | null> => {
    try {
      const sessionApprovedAmount = budgetSessionService.getSessionApprovedAmount(analyticAccountId);
      
      const response = await fetch('/api/budgets/impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticAccountId,
          invoiceAmount,
          sessionApprovedAmount
        }),
      });

      if (!response.ok) {
        console.error('Failed to calculate budget impact:', response.statusText);
        return null;
      }

      const budgetImpact = await response.json();
      
      // Store in session service and local state
      budgetSessionService.setBudgetImpact(analyticAccountId, budgetImpact);
      setBudgetImpacts(prev => new Map(prev).set(analyticAccountId, budgetImpact));
      
      return budgetImpact;
    } catch (error) {
      console.error('Error calculating budget impact:', error);
      return null;
    }
  }, []);

  const addApprovedInvoice = useCallback((
    invoiceId: number, 
    amount: number, 
    projectId?: number, 
    departmentId?: number
  ) => {
    budgetSessionService.addApprovedInvoice(invoiceId, amount, projectId, departmentId);
    refreshSessionStats();
  }, [refreshSessionStats]);

  const getBudgetImpact = useCallback((analyticAccountId: number): BudgetImpact | undefined => {
    return budgetImpacts.get(analyticAccountId) || budgetSessionService.getBudgetImpact(analyticAccountId);
  }, [budgetImpacts]);

  const getSessionApprovedAmount = useCallback((analyticAccountId: number): number => {
    return budgetSessionService.getSessionApprovedAmount(analyticAccountId);
  }, []);

  const isInvoiceApproved = useCallback((invoiceId: number): boolean => {
    return budgetSessionService.isInvoiceApproved(invoiceId);
  }, []);

  const clearSession = useCallback(() => {
    budgetSessionService.clearSession();
    setBudgetImpacts(new Map());
    refreshSessionStats();
  }, [refreshSessionStats]);

  const value: BudgetContextType = {
    budgetImpacts,
    sessionStats,
    calculateBudgetImpact,
    addApprovedInvoice,
    getBudgetImpact,
    getSessionApprovedAmount,
    isInvoiceApproved,
    clearSession,
    refreshSessionStats
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}