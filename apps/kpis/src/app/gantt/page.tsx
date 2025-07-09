"use client";

import { useState } from 'react';
import { DateTime } from 'luxon';
import ProjectGantt from '@/components/ProjectGantt';
import QueryProvider from '@/components/providers/QueryProvider';
import { useGanttMetrics } from '@/hooks/useGanttData';
import { DateRange } from '@/types/gantt';
import { SupportedLocale } from '@/types/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Helper function to calculate liquidity on a specific date
function calculateLiquidityOnDate(projects: any[], targetDate: DateTime): number {
  let runningBalance = 0;
  
  // Get all cash flows from all projects
  const allCashFlows = projects.flatMap(project => 
    project.cashFlows.map((cf: any) => ({
      ...cf,
      date: DateTime.fromJSDate(cf.date.toJSDate ? cf.date.toJSDate() : cf.date),
      amount: cf.type === 'income' ? cf.amount : -cf.amount
    }))
  );
  
  // Sort by date
  allCashFlows.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  
  // Calculate running balance up to target date
  for (const cashFlow of allCashFlows) {
    if (cashFlow.date <= targetDate) {
      runningBalance += cashFlow.amount;
    } else {
      break;
    }
  }
  
  return runningBalance;
}

// Enhanced function to get detailed cash flow analysis
function getDetailedCashFlowAnalysis(projects: any[], fromDate: DateTime, toDate: DateTime) {
  // Get all cash flows in the date range
  const allCashFlows = projects.flatMap(project => 
    project.cashFlows.map((cf: any) => ({
      ...cf,
      projectName: project.name,
      date: DateTime.fromJSDate(cf.date.toJSDate ? cf.date.toJSDate() : cf.date),
      amount: cf.type === 'income' ? cf.amount : -cf.amount
    }))
  ).filter(cf => cf.date >= fromDate && cf.date <= toDate);
  
  // Sort by date
  allCashFlows.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  
  // Calculate running balance day by day
  let runningBalance = calculateLiquidityOnDate(projects, fromDate);
  const dailyBalances: { date: DateTime; balance: number; flow: number }[] = [];
  
  // Get minimum balance and critical dates
  let minBalance = runningBalance;
  let minBalanceDate = fromDate;
  
  for (const cashFlow of allCashFlows) {
    runningBalance += cashFlow.amount;
    dailyBalances.push({
      date: cashFlow.date,
      balance: runningBalance,
      flow: cashFlow.amount
    });
    
    if (runningBalance < minBalance) {
      minBalance = runningBalance;
      minBalanceDate = cashFlow.date;
    }
  }
  
  // Get next major cash flows (>50k)
  const majorUpcomingFlows = allCashFlows
    .filter(cf => cf.date > DateTime.now() && Math.abs(cf.amount) > 50000)
    .slice(0, 3);
  
  return {
    currentBalance: calculateLiquidityOnDate(projects, DateTime.now()),
    minBalance,
    minBalanceDate,
    majorUpcomingFlows,
    totalIncome: allCashFlows.filter(cf => cf.amount > 0).reduce((sum, cf) => sum + cf.amount, 0),
    totalExpenses: allCashFlows.filter(cf => cf.amount < 0).reduce((sum, cf) => sum + Math.abs(cf.amount), 0),
    netCashFlow: allCashFlows.reduce((sum, cf) => sum + cf.amount, 0)
  };
}

function GanttMetricsCards({ 
  locale, 
  dateRange,
  projects
}: { 
  locale: SupportedLocale; 
  dateRange: DateRange;
  projects: any[];
}) {
  const { data: metrics, isLoading, error } = useGanttMetrics(dateRange);
  const [liquidityDate, setLiquidityDate] = useState(() => DateTime.now());

  if (isLoading || error || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    const localeString = locale === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(localeString, {
      style: 'currency',
      currency: 'EUR',
      notation: amount > 1000000 ? 'compact' : 'standard',
    }).format(amount);
  };

  const formatDate = (date: DateTime) => {
    const format = locale === 'es' ? "dd/MM/yyyy" : "MM/dd/yyyy";
    return date.toFormat(format);
  };

  // Calculate liquidity for selected date
  const liquidityOnDate = calculateLiquidityOnDate(projects, liquidityDate);
  
  // Get detailed cash flow analysis for the current date range
  const cashFlowAnalysis = projects.length > 0 ? 
    getDetailedCashFlowAnalysis(projects, dateRange.start, dateRange.end) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Phase Capacities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {locale === 'es' ? 'Capacidad de Fases' : 'Phase Capacity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries((metrics as any).capacityUtilization || {}).map(([phase, utilization]) => (
            <div key={phase} className="flex justify-between items-center text-sm">
              <span className="capitalize">
                {locale === 'es' ? {
                  purchase: 'Compra',
                  construction: 'Construcción',
                  sale: 'Venta',
                }[phase] : {
                  purchase: 'Purchase',
                  construction: 'Construction', 
                  sale: 'Sale',
                }[phase]}:
              </span>
              <span className={`font-semibold ${
                (utilization as number) >= 1.0 ? 'text-red-600' : 
                (utilization as number) >= 0.8 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {Math.round((utilization as number) * 100)}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Budget */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {locale === 'es' ? 'Presupuesto Activo' : 'Active Budget'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency((metrics as any).totalActiveBudget || 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === 'es' ? 'En proyectos activos' : 'In active projects'}
          </p>
        </CardContent>
      </Card>

      {/* Net Cash Flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {locale === 'es' ? 'Flujo Neto de Caja' : 'Net Cash Flow'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${
            (cashFlowAnalysis?.netCashFlow ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(cashFlowAnalysis?.netCashFlow ?? 0)}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">
                {locale === 'es' ? 'Ingresos:' : 'Income:'}
              </span>
              <span className="font-semibold">
                {formatCurrency(cashFlowAnalysis?.totalIncome ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600">
                {locale === 'es' ? 'Gastos:' : 'Expenses:'}
              </span>
              <span className="font-semibold">
                {formatCurrency(cashFlowAnalysis?.totalExpenses ?? 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Liquidity Projection */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-sm">
             {locale === 'es' ? 'Liquidez Proyectada' : 'Projected Liquidity'}
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-2">
           <div>
             <p className={`text-2xl font-bold ${
               liquidityOnDate >= 0 ? 'text-green-600' : 'text-red-600'
             }`}>
               {formatCurrency(liquidityOnDate)}
             </p>
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   size="sm"
                   className="h-6 px-2 text-xs font-normal justify-start w-full mt-1"
                 >
                   <CalendarIcon className="mr-1 h-3 w-3" />
                   {formatDate(liquidityDate)}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-3" align="start">
                 <div className="space-y-3">
                   <div className="text-sm font-medium">
                     {locale === 'es' ? 'Fecha para proyección' : 'Date for projection'}
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setLiquidityDate(DateTime.now())}
                       className="h-7 text-xs"
                     >
                       {locale === 'es' ? 'Hoy' : 'Today'}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setLiquidityDate(DateTime.now().plus({ months: 1 }))}
                       className="h-7 text-xs"
                     >
                       {locale === 'es' ? '+1 mes' : '+1 month'}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setLiquidityDate(DateTime.now().plus({ months: 3 }))}
                       className="h-7 text-xs"
                     >
                       {locale === 'es' ? '+3 meses' : '+3 months'}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setLiquidityDate(DateTime.now().plus({ months: 6 }))}
                       className="h-7 text-xs"
                     >
                       {locale === 'es' ? '+6 meses' : '+6 months'}
                     </Button>
                   </div>
                 </div>
               </PopoverContent>
             </Popover>
           </div>
           
           {/* Critical liquidity info */}
           {cashFlowAnalysis && (
             <div className="border-t pt-2 space-y-1">
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">
                   {locale === 'es' ? 'Mín. esperado:' : 'Min expected:'}
                 </span>
                 <span className={`font-semibold ${
                   cashFlowAnalysis.minBalance < 0 ? 'text-red-600' : 'text-yellow-600'
                 }`}>
                   {formatCurrency(cashFlowAnalysis.minBalance)}
                 </span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-muted-foreground">
                   {locale === 'es' ? 'Fecha crítica:' : 'Critical date:'}
                 </span>
                 <span className="font-semibold text-xs">
                   {formatDate(cashFlowAnalysis.minBalanceDate)}
                 </span>
               </div>
             </div>
           )}
         </CardContent>
       </Card>

      {/* Project Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {locale === 'es' ? 'Estadísticas de Proyectos' : 'Project Stats'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{locale === 'es' ? 'Completados:' : 'Completed:'}</span>
            <span className="font-semibold text-green-600">{(metrics as any).completedProjects || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{locale === 'es' ? 'Activos:' : 'Active:'}</span>
            <span className="font-semibold text-blue-600">{projects.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{locale === 'es' ? 'Duración prom:' : 'Avg duration:'}</span>
            <span className="font-semibold">
              {Math.round((metrics as any).averageProjectDuration || 6)}{locale === 'es' ? 'm' : 'mo'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GanttPageContent() {
  const [locale, setLocale] = useState<SupportedLocale>('en');
  
  // Shared date range state for both metrics and gantt chart
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = DateTime.now();
    return {
      start: now.minus({ months: 6 }).startOf('month'),
      end: now.plus({ months: 12 }).endOf('month')
    };
  });

  // Track projects data to pass to metrics
  const [projectsData, setProjectsData] = useState<any[]>([]);

  // Debug: Log when projects data changes
  console.log('Projects data updated:', projectsData.length, 'projects');
  if (projectsData.length > 0) {
    const totalCashFlows = projectsData.reduce((sum, p) => sum + p.cashFlows.length, 0);
    console.log('Total cash flows across all projects:', totalCashFlows);
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Top metrics cards */}
      <div className="p-6 pb-0">
        <GanttMetricsCards 
          locale={locale} 
          dateRange={dateRange} 
          projects={projectsData} 
        />
      </div>

      {/* Main Gantt Timeline - Full width without extra padding */}
      <div className="px-6 pb-6">
        <ProjectGantt 
          locale={locale} 
          onLocaleChange={setLocale}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onProjectsDataChange={setProjectsData}
        />
      </div>
    </div>
  );
}

export default function GanttPage() {
  return (
    <QueryProvider>
      <GanttPageContent />
    </QueryProvider>
  );
} 