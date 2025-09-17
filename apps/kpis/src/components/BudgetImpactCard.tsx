'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Info } from 'lucide-react';
import { BudgetImpact } from '@isleno/types/odoo';
import { formatCurrency } from '@/lib/utils';
import { useBudget } from '@/contexts/BudgetContext';

interface BudgetImpactCardProps {
  analyticAccountId?: number;
  analyticAccountName?: string;
  invoiceAmount: number;
  className?: string;
  // Construction-specific props
  projectId?: number;
  projectName?: string;
  spendCategoryId?: number;
  spendCategoryName?: string;
  // Department-specific props
  departmentId?: number;
  departmentName?: string;
  invoiceIssueDate?: string;
  // Invoice type
  invoiceType?: 'construction' | 'department';
  // Callback for budget impact changes
  onBudgetImpactChange?: (budgetImpact: BudgetImpact | null) => void;
}

export function BudgetImpactCard({ 
  analyticAccountId, 
  analyticAccountName, 
  invoiceAmount,
  className = '',
  projectId,
  projectName,
  spendCategoryId,
  spendCategoryName,
  departmentId,
  departmentName,
  invoiceIssueDate,
  invoiceType = 'department',
  onBudgetImpactChange
}: BudgetImpactCardProps) {
  const t = useTranslations('invoices.budgetImpact');
  const { 
    calculateBudgetImpact, 
    calculateConstructionBudgetImpact,
    calculateDepartmentBudgetImpact,
    getBudgetImpact 
  } = useBudget();
  const [budgetImpact, setBudgetImpact] = useState<BudgetImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBudgetImpact = async () => {
      setLoading(true);
      setError(null);

      try {
        let impact: BudgetImpact | null = null;

        if (invoiceType === 'construction') {
          // Construction invoice logic
          if (!projectId) {
            setError(t('pleaseSelectProject'));
            setLoading(false);
            return;
          }

          if (!spendCategoryId) {
            setError(t('pleaseSelectSpendCategory'));
            setLoading(false);
            return;
          }

          // Check if we already have the impact calculated
          const existingImpact = getBudgetImpact(projectId);
          if (existingImpact && existingImpact.invoiceAmount === invoiceAmount) {
            setBudgetImpact(existingImpact);
            setLoading(false);
            return;
          }

          // Calculate construction budget impact
          impact = await calculateConstructionBudgetImpact(projectId, spendCategoryId, invoiceAmount);
        } else {
          // Department invoice logic
          if (!departmentId) {
            setError(t('pleaseSelectDepartment'));
            setLoading(false);
            return;
          }

          if (!invoiceIssueDate) {
            setError(t('invoiceIssueDateRequired'));
            setLoading(false);
            return;
          }

          // Check if we already have the impact calculated
          const existingImpact = getBudgetImpact(departmentId);
          if (existingImpact && existingImpact.invoiceAmount === invoiceAmount) {
            setBudgetImpact(existingImpact);
            setLoading(false);
            return;
          }

          // Calculate department budget impact
          impact = await calculateDepartmentBudgetImpact(departmentId, departmentName!, invoiceAmount, invoiceIssueDate);
        }

        if (impact) {
          setBudgetImpact(impact);
          onBudgetImpactChange?.(impact);
        } else {
          setError(t('budgetNotAvailable'));
          onBudgetImpactChange?.(null);
        }
      } catch (err) {
        console.error('Error loading budget impact:', err);
        setError(t('failedToLoadBudget'));
      } finally {
        setLoading(false);
      }
    };

    if (invoiceAmount > 0) {
      loadBudgetImpact();
    }
  }, [
    analyticAccountId, 
    invoiceAmount, 
    projectId, 
    spendCategoryId, 
    departmentId, 
    departmentName, 
    invoiceIssueDate, 
    invoiceType,
    calculateBudgetImpact,
    calculateConstructionBudgetImpact,
    calculateDepartmentBudgetImpact,
    getBudgetImpact
  ]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('title')}
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
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {error || t('error')}
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
      return <Badge variant="destructive">{t('willExceedBudget')}</Badge>;
    }
    if (isCurrentlyOver) {
      return <Badge variant="secondary">{t('currentlyOverBudget')}</Badge>;
    }
    return <Badge variant="default">{t('withinBudget')}</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          {getBudgetStatusBadge(budgetImpact.willBeOverBudget, budgetImpact.isOverBudget)}
        </div>
        <p className="text-sm text-muted-foreground">
          {invoiceType === 'construction' 
            ? `${projectName || 'Project'} - ${spendCategoryName || 'Spend Category'}`
            : departmentName || analyticAccountName
          }
        </p>
        {budgetImpact.isMockData && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {t('usingSampleData')}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('totalBudget')}</p>
            <p className="text-lg font-bold">
              {formatCurrency(budgetImpact.currentBudget)} {budgetImpact.currency}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('invoiceAmount')}</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(budgetImpact.invoiceAmount)} {budgetImpact.currency}
            </p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            {t('beforeApproval')}
          </h4>
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('spent')}</span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.currentSpent)} {budgetImpact.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('remaining')}</span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.currentRemaining)} {budgetImpact.currency}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('budgetUsage')}</span>
                <span>{budgetImpact.percentageUsed.toFixed(1)}%</span>
              </div>
              <Progress value={budgetImpact.percentageUsed} className="h-2" />
            </div>
          </div>

          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('afterApproval')}
          </h4>
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('spent')}</span>
              <span className={`font-medium ${getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}`}>
                {formatCurrency(budgetImpact.projectedSpent)} {budgetImpact.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('remaining')}</span>
              <span className={`font-medium ${getBudgetStatusColor(budgetImpact.willBeOverBudget, budgetImpact.projectedPercentageUsed)}`}>
                {formatCurrency(budgetImpact.projectedRemaining)} {budgetImpact.currency}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('budgetUsage')}</span>
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
                {t('budgetExceeded')}
              </p>
              <p className="text-sm text-red-700">
                {t('budgetExceededDescription')}{' '}
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
            <span className="text-sm font-medium">{t('budgetImpact')}</span>
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
