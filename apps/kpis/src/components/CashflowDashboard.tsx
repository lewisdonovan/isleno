"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useCashflowDashboard } from "@/hooks/useCashflowDashboard";
import { TrendingUp, TrendingDown, Building2, Clock, Target, MapPin, Info } from "lucide-react";
import { DateTime } from 'luxon';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { MetricCard } from "@/components/cashflow/MetricCard";
import { PhaseCapacityCards } from "@/components/cashflow/PhaseCapacityCards";
import { CASHFLOW_CHART_CONFIG, UPCOMING_EVENTS_CHART_CONFIG } from '@/configs/charts';
import { useTranslations } from 'next-intl';

function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(0)}K`;
  } else {
    return `€${amount.toFixed(0)}`;
  }
}

function getPhaseColor(utilization: number): string {
  // Goal is to motivate full capacity usage, not throttle it
  // Red: 0/4 - 1/4 (underutilized), Yellow: 2/4 - 3/4 (moderate), Green: 4/4+ (full/over capacity)
  if (utilization <= 0.25) return 'text-red-600 dark:text-red-400';      // 0-25% - underutilized (bad)
  if (utilization <= 0.75) return 'text-yellow-600 dark:text-yellow-400'; // 26-75% - moderate utilization
  return 'text-green-600 dark:text-green-400';                            // 76%+ - good utilization
}

const chartConfig = {
  inflow: {
    label: "Inflow",
    color: "#10b981", // green-500 for positive cash flow
  },
  outflow: {
    label: "Outflow", 
    color: "#ef4444", // red-500 for negative cash flow
  },
  cumulativeLiquidity: {
    label: "Net Liquidity",
    color: "#0d9488", // teal-600 for net liquidity
  },
} satisfies ChartConfig;

const upcomingEventsChartConfig = {
  amount: {
    label: "Amount",
    color: "#14b8a6", // teal-500 for consistent green theme
  },
} satisfies ChartConfig;

function UpcomingEventsChart({ events }: { events: any[] }) {
  // Group events by month and sum amounts
  const now = DateTime.now();
  const nextSixMonths = Array.from({ length: 6 }, (_, i) => {
    const month = now.plus({ months: i });
    return {
      month: month.toFormat('MMM'),
      fullMonth: month,
      amount: 0,
    };
  });

  // Add up events for each month
  events
    .filter(event => event.date >= now && event.date <= now.plus({ months: 6 }))
    .forEach(event => {
      const eventMonth = event.date.startOf('month');
      const monthData = nextSixMonths.find(m => m.fullMonth.startOf('month').equals(eventMonth));
      if (monthData) {
        monthData.amount += event.amount;
      }
    });

  return (
            <ChartContainer config={UPCOMING_EVENTS_CHART_CONFIG}>
      <BarChart accessibilityLayer data={nextSixMonths}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatCurrencyShort(value)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
          formatter={(value) => [formatCurrencyShort(value as number), "Net Cashflow"]}
        />
        <Bar 
          dataKey="amount" 
          fill="var(--color-amount)" 
          radius={8}
        >
          {nextSixMonths.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function CashflowProjectionChart({ monthlyProjections }: { monthlyProjections: any[] }) {
  // Transform data for the chart - take first 6 months and format month names
  const chartData = monthlyProjections.slice(0, 6).map(month => ({
    month: month.month.split(' ')[0], // Just the month name (Jan, Feb, etc.)
    inflow: month.inflow,
    outflow: month.outflow,
    cumulativeLiquidity: month.cumulativeLiquidity,
  }));
  
  return (
            <ChartContainer config={CASHFLOW_CHART_CONFIG}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatCurrencyShort(value)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
          formatter={(value, name) => [
            formatCurrencyShort(value as number),
            chartConfig[name as keyof typeof chartConfig]?.label || name,
          ]}
        />
        <Area
          dataKey="cumulativeLiquidity"
          type="natural"
          fill="var(--color-cumulativeLiquidity)"
          fillOpacity={0.2}
          stroke="var(--color-cumulativeLiquidity)"
          strokeWidth={2}
        />
        <Area
          dataKey="inflow"
          type="natural"
          fill="var(--color-inflow)"
          fillOpacity={0.3}
          stroke="var(--color-inflow)"
          strokeWidth={2}
        />
        <Area
          dataKey="outflow"
          type="natural"
          fill="var(--color-outflow)"
          fillOpacity={0.3}
          stroke="var(--color-outflow)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export default function CashflowDashboard() {
  const { kpiData, loading, error } = useCashflowDashboard();
  const t = useTranslations('components.cashflow');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>{t('loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !kpiData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>{t('failedToLoad')}</p>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('weeklyInvestmentNew')}
          value={formatCurrencyShort(kpiData.weeklyFinancialMetrics.weeklyInvestment.totalSpend)}
          description={t('weeklyInvestmentNewDesc')}
          icon={TrendingUp}
          textColor="text-blue-600"
          dataSourceKey="weeklyInvestmentNew"
        />
        <MetricCard
          title={t('avgMonthlySpend')}
          value={formatCurrencyShort(kpiData.weeklyFinancialMetrics.weeklyInvestment.avgMonthlySpend)}
          description={t('avgMonthlySpendDesc')}
          icon={TrendingUp}
          dataSourceKey="avgMonthlySpend"
        />
        <MetricCard
          title={t('weeklyMargin')}
          value={formatCurrencyShort(kpiData.weeklyFinancialMetrics.weeklyMargin.weeklyMargin)}
          description={t('weeklyMarginDesc')}
          icon={TrendingUp}
          textColor="text-green-600"
          dataSourceKey="weeklyMargin"
        />
        <MetricCard
          title={t('generatedValue')}
          value={formatCurrencyShort(kpiData.weeklyFinancialMetrics.generatedValue)}
          description={t('generatedValueDesc')}
          icon={TrendingUp}
          textColor="text-purple-600"
          dataSourceKey="generatedValue"
        />
      </div>



      {/* Phase Capacity Utilization */}
      <PhaseCapacityCards phaseCapacity={kpiData.phaseCapacity} />

      {/* Cashflow Projection Chart */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <CardTitle>{t('cashflowProjectionTitle')}</CardTitle>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Data Source</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('dataSource.cashflowProjection')}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <CardDescription>
              {t('cashflowProjectionDesc')}
            </CardDescription>
          </div>
          <div className="flex">
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
              <span className="text-xs text-muted-foreground">
                {t('netChange6Months')}
              </span>
              <span className={`text-lg font-bold leading-none sm:text-3xl ${
                kpiData.monthlyProjections[5]?.cumulativeLiquidity > kpiData.currentLiquidity 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {kpiData.monthlyProjections[5]?.cumulativeLiquidity > kpiData.currentLiquidity ? '+' : ''}
                {formatCurrencyShort(
                  (kpiData.monthlyProjections[5]?.cumulativeLiquidity || kpiData.currentLiquidity) - kpiData.currentLiquidity
                )}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <CashflowProjectionChart monthlyProjections={kpiData.monthlyProjections} />
        </CardContent>
      </Card>

      {/* Project Profitability Analysis */}
      <Card>
        <CardHeader>
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <CardTitle>{t('projectProfitabilityTitle')}</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Data Source</h4>
                <p className="text-sm text-muted-foreground">
                  {t('dataSource.projectProfitability')}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <CardDescription>
            {t('projectProfitabilityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kpiData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t('project')}</th>
                    <th className="text-left p-2">{t('zone')}</th>
                    <th className="text-left p-2">{t('phase')}</th>
                    <th className="text-right p-2">{t('totalCost')}</th>
                    <th className="text-right p-2">{t('salePrice')}</th>
                    <th className="text-right p-2">{t('margin')}</th>
                    <th className="text-right p-2">{t('weeklyValue')}</th>
                    <th className="text-center p-2">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiData.projectProfitability
                  .sort((a, b) => b.profitabilityMargin - a.profitabilityMargin)
                  .map((project) => (
                    <tr key={project.projectId} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-muted-foreground">{project.propertyId}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          project.zone === 'PMI' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {project.zone}
                        </span>
                      </td>
                      <td className="p-2 text-xs">{project.phase}</td>
                      <td className="p-2 text-right font-mono">
                        {formatCurrencyShort(project.totalCost)}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {project.salePrice > 0 ? formatCurrencyShort(project.salePrice) : '-'}
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-medium ${
                          project.profitabilityMargin >= 1.2 
                            ? 'text-green-600 dark:text-green-400'
                            : project.profitabilityMargin >= 1.0
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {project.salePrice > 0 ? `${Math.round(project.profitabilityMargin * 100)}%` : '-'}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-green-600">
                        {!project.isCompleted && project.phase === 'Renovation' 
                          ? formatCurrencyShort(project.weeklyValueCreation)
                          : '-'
                        }
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-col gap-1">
                          {project.meetsMinimumMargin && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              ✓ 120%
                            </span>
                          )}
                          {project.isRental && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              {t('rental')}
                            </span>
                          )}
                          {project.isCompleted && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                              {t('done')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                                     ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 