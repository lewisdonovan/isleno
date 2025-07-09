"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCashflowDashboard } from "@/hooks/useCashflowDashboard";
import { TrendingUp, TrendingDown, Building2, Clock, Target, MapPin } from "lucide-react";
import { DateTime } from 'luxon';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

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
    <ChartContainer config={upcomingEventsChartConfig}>
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
    <ChartContainer config={chartConfig}>
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
              </div>

      {/* Project Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Project Profitability Analysis</CardTitle>
          <CardDescription>
            Detailed profitability metrics for all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kpiData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Project</th>
                    <th className="text-left p-2">Zone</th>
                    <th className="text-left p-2">Phase</th>
                    <th className="text-right p-2">Total Cost</th>
                    <th className="text-right p-2">Sale Price</th>
                    <th className="text-right p-2">Margin</th>
                    <th className="text-right p-2">Weekly Value</th>
                    <th className="text-center p-2">Status</th>
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
                              Rental
                            </span>
                          )}
                          {project.isCompleted && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                              Done
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

  if (error || !kpiData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Failed to load cashflow data</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Liquidity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyShort(kpiData.currentLiquidity)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available cash for investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyShort(kpiData.projectedLiquidityIn30Days)}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpiData.projectedLiquidityIn30Days > kpiData.currentLiquidity ? (
                <span className="text-green-600">+{formatCurrencyShort(kpiData.projectedLiquidityIn30Days - kpiData.currentLiquidity)}</span>
              ) : (
                <span className="text-red-600">{formatCurrencyShort(kpiData.projectedLiquidityIn30Days - kpiData.currentLiquidity)}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyShort(kpiData.projectedLiquidityIn90Days)}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpiData.projectedLiquidityIn90Days > kpiData.currentLiquidity ? (
                <span className="text-green-600">+{formatCurrencyShort(kpiData.projectedLiquidityIn90Days - kpiData.currentLiquidity)}</span>
              ) : (
                <span className="text-red-600">{formatCurrencyShort(kpiData.projectedLiquidityIn90Days - kpiData.currentLiquidity)}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
            {kpiData.netCashflow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpiData.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyShort(kpiData.netCashflow)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue: {formatCurrencyShort(kpiData.totalProjectedRevenue)} | 
              Costs: {formatCurrencyShort(kpiData.totalProjectedCosts)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Head of Finance KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Project Profitability</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              kpiData.averageProjectProfitability >= 1.2 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {Math.round(kpiData.averageProjectProfitability * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: ≥120% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Above 120%</CardTitle>
            {kpiData.projectsMeetingMinimumMargin / kpiData.totalProjectsMeetingMinimumMargin >= 0.8 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.projectsMeetingMinimumMargin}/{kpiData.totalProjectsMeetingMinimumMargin}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((kpiData.projectsMeetingMinimumMargin / kpiData.totalProjectsMeetingMinimumMargin) * 100)}% meeting minimum margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rental Profitability</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(kpiData.averageRentalProfitability * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Yearly rental / property value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Value Creation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyShort(kpiData.totalWeeklyValueCreation)}
            </div>
            <p className="text-xs text-muted-foreground">
              Nominal euros per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Value Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(kpiData.averageWeeklyValueCreationPercent * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Avg margin of project cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(kpiData.averageProjectProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completing This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.projectsCompletingThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.projectsCompletingNextMonth} next month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zone Distribution</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.pmiProjects} / {kpiData.mahProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              PMI / MAH projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Phase Capacity Utilization */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpiData.phaseCapacity.map((phase) => (
          <Card key={phase.phase}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{phase.phase} Phase</CardTitle>
              <CardDescription>
                Capacity utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{phase.occupied}/{phase.total}</span>
                <span className={`text-sm font-medium ${getPhaseColor(phase.utilization)}`}>
                  {Math.round(phase.utilization * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    phase.utilization >= 1.0 ? 'bg-red-500' :
                    phase.utilization >= 0.8 ? 'bg-orange-500' :
                    phase.utilization >= 0.6 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(phase.utilization * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {phase.total - phase.occupied} slots available
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cashflow Projection Chart */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>6-Month Cashflow Projection</CardTitle>
            <CardDescription>
              Projected inflows, outflows, and net liquidity
            </CardDescription>
          </div>
          <div className="flex">
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
              <span className="text-xs text-muted-foreground">
                Net Change (6 months)
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

      {/* Upcoming Cashflow Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cashflow Overview</CardTitle>
            <CardDescription>
              Net cashflow by month for the next 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingEventsChart events={kpiData.cashflowEvents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Cashflow Events</CardTitle>
            <CardDescription>
              Next 10 scheduled payments and revenues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kpiData.cashflowEvents
                .filter(event => event.date >= DateTime.now())
                .sort((a, b) => a.date.toMillis() - b.date.toMillis())
                .slice(0, 10)
                .map((event, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date.toFormat('MMM dd, yyyy')} • {event.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${event.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {event.amount >= 0 ? '+' : ''}{formatCurrencyShort(event.amount)}
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 