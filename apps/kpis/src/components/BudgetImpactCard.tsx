'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { BudgetImpact } from '@isleno/types/odoo';
import { formatCurrency } from '@/lib/utils';
import { useBudget } from '@/contexts/BudgetContext';

interface BudgetImpactCardProps {
  analyticAccountId: number;
  analyticAccountName: string;
  invoiceAmount: number;
  className?: string;
}

export function BudgetImpactCard({ 
  analyticAccountId, 
  analyticAccountName, 
  invoiceAmount,
  className = ''
}: BudgetImpactCardProps) {
  const { calculateBudgetImpact, getBudgetImpact } = useBudget();
  const [budgetImpact, setBudgetImpact] = useState<BudgetImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBudgetImpact = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if we already have the impact calculated
        const existingImpact = getBudgetImpact(analyticAccountId);
        if (existingImpact && existingImpact.invoiceAmount === invoiceAmount) {
          setBudgetImpact(existingImpact);
          setLoading(false);
          return;
        }

        // Calculate new impact
        const impact = await calculateBudgetImpact(analyticAccountId, invoiceAmount);
        if (impact) {
          setBudgetImpact(impact);
        } else {
          setError('Budget information not available for this project/department');
        }
      } catch (err) {
        console.error('Error loading budget impact:', err);
        setError('Failed to load budget information');
      } finally {
        setLoading(false);
      }
    };

    if (analyticAccountId && invoiceAmount > 0) {
      loadBudgetImpact();
    }
  }, [analyticAccountId, invoiceAmount, calculateBudgetImpact, getBudgetImpact]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !budgetImpact) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {error || 'Budget information not available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBudgetStatusColor = (willBeOver: boolean, percentageUsed: number) => {
    if (willBeOver) return 'text-red-600';
    if (percentageUsed > 90) return 'text-orange-600';
    if (percentageUsed > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetStatusBadge = (willBeOver: boolean, isCurrentlyOver: boolean) => {
    if (willBeOver) {
      return <Badge variant="destructive">Will Exceed Budget</Badge>;
    }
    if (isCurrentlyOver) {
      return <Badge variant="secondary">Currently Over Budget</Badge>;
    }
    return <Badge variant="default">Within Budget</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Impact Analysis
          </CardTitle>
          {getBudgetStatusBadge(budgetImpact.willBeOverBudget, budgetImpact.isOverBudget)}
        </div>
        <p className="text-sm text-muted-foreground">
          {analyticAccountName}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Total Budget</p>
            <p className="text-lg font-bold">
              {formatCurrency(budgetImpact.currentBudget)} {budgetImpact.currency}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Invoice Amount</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(budgetImpact.invoiceAmount)} {budgetImpact.currency}
            </p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Before Approval
          </h4>
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.currentSpent)} {budgetImpact.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.currentRemaining)} {budgetImpact.currency}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span>{budgetImpact.percentageUsed.toFixed(1)}%</span>
              </div>
              <Progress value={budgetImpact.percentageUsed} className="h-2" />
            </div>
          </div>

          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            After Approval
          </h4>
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className={`font-medium ${getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}`}>
                {formatCurrency(budgetImpact.projectedSpent)} {budgetImpact.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className={`font-medium ${getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}`}>
                {formatCurrency(budgetImpact.projectedRemaining)} {budgetImpact.currency}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span className={getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}>
                  {budgetImpact.projectedPercentageUsed.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(budgetImpact.projectedPercentageUsed, 100)} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Warning if budget will be exceeded */}
        {budgetImpact.willBeOverBudget && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800">
                Budget Exceeded
              </p>
              <p className="text-sm text-red-700">
                Approving this invoice will exceed the budget by{' '}
                <span className="font-medium">
                  {formatCurrency(Math.abs(budgetImpact.projectedRemaining))} {budgetImpact.currency}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Impact Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Budget Impact</span>
            <span className={`text-lg font-bold ${getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}`}>
              {budgetImpact.projectedPercentageUsed > budgetImpact.percentageUsed ? '+' : ''}
              {(budgetImpact.projectedPercentageUsed - budgetImpact.percentageUsed).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}