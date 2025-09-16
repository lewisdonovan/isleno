import { useState, useEffect } from 'react';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
}

interface BudgetImpactData {
  currentBudget: BudgetSummary | null;
  projectedBudget: BudgetSummary | null;
  sessionTotal: number;
  loading: boolean;
  error: string | null;
  mock?: boolean;
}

interface SessionApproval {
  invoiceId: number;
  amount: number;
  timestamp: Date;
}

// Store session approvals in memory (will reset on page refresh)
let sessionApprovals: SessionApproval[] = [];

export function useBudgetImpact(
  departmentId: number | null,
  projectId: number | null,
  currentInvoiceAmount: number,
  currentInvoiceId: number
) {
  const [budgetData, setBudgetData] = useState<BudgetImpactData>({
    currentBudget: null,
    projectedBudget: null,
    sessionTotal: 0,
    loading: true,
    error: null,
    mock: false
  });

  useEffect(() => {
    if (!departmentId && !projectId) {
      setBudgetData(prev => ({
        ...prev,
        loading: false,
        error: null,
        currentBudget: null,
        projectedBudget: null
      }));
      return;
    }

    const fetchBudgetData = async () => {
      try {
        setBudgetData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch budget data
        const params = new URLSearchParams();
        if (projectId) {
          params.append('projectId', projectId.toString());
        } else if (departmentId) {
          params.append('departmentId', departmentId.toString());
        }

        const response = await fetch(`/api/odoo/budgets?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch budget data');
        }

        // Calculate session total (excluding current invoice if already approved)
        const sessionTotal = sessionApprovals
          .filter(approval => approval.invoiceId !== currentInvoiceId)
          .reduce((sum, approval) => sum + approval.amount, 0);

        // Calculate projected budget after approval
        const projectedSpent = data.summary.totalSpent + sessionTotal + currentInvoiceAmount;
        const projectedRemaining = data.summary.totalBudget - projectedSpent;
        const projectedPercentage = data.summary.totalBudget > 0 
          ? (projectedSpent / data.summary.totalBudget) * 100 
          : 0;

        setBudgetData({
          currentBudget: {
            ...data.summary,
            totalSpent: data.summary.totalSpent + sessionTotal
          },
          projectedBudget: {
            totalBudget: data.summary.totalBudget,
            totalSpent: projectedSpent,
            remainingBudget: projectedRemaining,
            percentageUsed: Math.round(projectedPercentage * 100) / 100
          },
          sessionTotal,
          loading: false,
          error: null,
          mock: data.mock || false
        });
      } catch (error) {
        console.error('Error fetching budget data:', error);
        setBudgetData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch budget data'
        }));
      }
    };

    fetchBudgetData();
  }, [departmentId, projectId, currentInvoiceAmount, currentInvoiceId]);

  return budgetData;
}

// Helper function to add an approval to the session
export function addSessionApproval(invoiceId: number, amount: number) {
  // Check if invoice already approved in this session
  const existingIndex = sessionApprovals.findIndex(a => a.invoiceId === invoiceId);
  
  if (existingIndex >= 0) {
    // Update existing approval
    sessionApprovals[existingIndex] = {
      invoiceId,
      amount,
      timestamp: new Date()
    };
  } else {
    // Add new approval
    sessionApprovals.push({
      invoiceId,
      amount,
      timestamp: new Date()
    });
  }
}

// Helper function to get session approvals
export function getSessionApprovals(): SessionApproval[] {
  return [...sessionApprovals];
}

// Helper function to clear session approvals
export function clearSessionApprovals() {
  sessionApprovals = [];
}