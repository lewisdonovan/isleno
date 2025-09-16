import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Info, DollarSign } from "lucide-react";
import { useTranslations } from 'next-intl';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
}

interface BudgetImpactCardProps {
  currentBudget: BudgetSummary | null;
  projectedBudget: BudgetSummary | null;
  invoiceAmount: number;
  currencySymbol: string;
  loading: boolean;
  error: string | null;
  sessionTotal: number;
  mock?: boolean;
}

export function BudgetImpactCard({
  currentBudget,
  projectedBudget,
  invoiceAmount,
  currencySymbol,
  loading,
  error,
  sessionTotal,
  mock = false
}: BudgetImpactCardProps) {
  const t = useTranslations('invoices.budgetImpact');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!currentBudget || !projectedBudget) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const isOverBudget = projectedBudget.remainingBudget < 0;
  const willExceed80Percent = projectedBudget.percentageUsed > 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Impact Analysis
        </CardTitle>
        {mock && (
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('mockDataNote')}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Total Info */}
        {sessionTotal > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('sessionApprovals')}: {formatCurrency(sessionTotal)}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Budget Status */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">{t('currentStatus')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('totalBudget')}</span>
              <span className="font-medium">{formatCurrency(currentBudget.totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('alreadySpent')}</span>
              <span className="font-medium">{formatCurrency(currentBudget.totalSpent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('remaining')}</span>
              <span className="font-medium">{formatCurrency(currentBudget.remainingBudget)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('usage')}</span>
                <span className="text-sm font-medium">{formatPercentage(currentBudget.percentageUsed)}</span>
              </div>
              <Progress value={currentBudget.percentageUsed} className="h-2" />
            </div>
          </div>
        </div>

        {/* Invoice Impact */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">{t('thisInvoiceAmount')}</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(invoiceAmount)}</span>
          </div>
        </div>

        {/* Projected Budget After Approval */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">{t('afterApproval')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('totalSpent')}</span>
              <span className="font-medium flex items-center gap-2">
                {formatCurrency(projectedBudget.totalSpent)}
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">{t('remaining')}</span>
              <span className={`font-medium flex items-center gap-2 ${isOverBudget ? 'text-red-600' : ''}`}>
                {formatCurrency(projectedBudget.remainingBudget)}
                {isOverBudget && <AlertTriangle className="h-4 w-4" />}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('usage')}</span>
                <span className={`text-sm font-medium ${projectedBudget.percentageUsed > 100 ? 'text-red-600' : ''}`}>
                  {formatPercentage(projectedBudget.percentageUsed)}
                </span>
              </div>
              <Progress 
                value={Math.min(projectedBudget.percentageUsed, 100)} 
                className={`h-2 ${projectedBudget.percentageUsed > 100 ? 'bg-red-100' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(isOverBudget || willExceed80Percent) && (
          <Alert variant={isOverBudget ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isOverBudget 
                ? `${t('warningOverBudget')} ${formatCurrency(Math.abs(projectedBudget.remainingBudget))}`
                : `${t('noticeHighUsage')} ${formatPercentage(projectedBudget.percentageUsed)} ${t('ofTheBudget')}`
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}