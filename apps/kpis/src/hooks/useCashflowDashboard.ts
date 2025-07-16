import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { calculatePhaseCapacity, PhaseCapacity } from '@/lib/services/operationalService';
import {
  type TimelineCashflowEvent
} from '@/lib/gantt/services';
import { projectsDataService } from '@/lib/services/projectsDataService';
import { ProjectData } from '@/types/projects';

export interface ProjectProfitability {
  projectId: string;
  propertyId: string;
  name: string;
  zone: 'PMI' | 'MAH';
  phase: string;
  progress: number;
  
  // Financial metrics
  totalCost: number; // Purchase + construction
  salePrice: number;
  profitabilityMargin: number; // Sale price / total cost
  estimatedProfit: number; // Sale price - total cost
  
  // Construction value creation
  weeklyValueCreation: number; // Estimated profit / 6 weeks
  weeklyValueCreationPercent: number; // Weekly value / total cost
  
  // Rental metrics (if applicable)
  yearlyRentalRevenue?: number;
  rentalProfitability?: number; // Yearly rental / property value
  
  // Status flags
  meetsMinimumMargin: boolean; // >= 120%
  isRental: boolean;
  isCompleted: boolean;
}

export interface KpiData {
  // Financial KPIs
  currentLiquidity: number;
  projectedLiquidityIn30Days: number;
  projectedLiquidityIn90Days: number;
  totalProjectedRevenue: number;
  totalProjectedCosts: number;
  netCashflow: number;
  
  // New Financial KPIs from Head of Finance
  averageProjectProfitability: number;
  projectsMeetingMinimumMargin: number;
  totalProjectsMeetingMinimumMargin: number;
  averageRentalProfitability: number;
  totalWeeklyValueCreation: number;
  averageWeeklyValueCreationPercent: number; // New: Average weekly value creation as % of project cost
  
  // Operational KPIs
  activeProjects: number;
  completedProjects: number;
  phaseCapacity: PhaseCapacity[];
  
  // Performance metrics
  averageProjectProgress: number;
  projectsCompletingThisMonth: number;
  projectsCompletingNextMonth: number;
  
  // Zone breakdown
  pmiProjects: number;
  mahProjects: number;
  
  // Detailed project analysis
  projectProfitability: ProjectProfitability[];
  
  // Cashflow timeline data
  cashflowEvents: TimelineCashflowEvent[];
  monthlyProjections: Array<{
    month: string;
    inflow: number;
    outflow: number;
    netFlow: number;
    cumulativeLiquidity: number;
  }>;
}

// Calculate monthly cashflow projections for chart
function calculateMonthlyProjections(
  events: TimelineCashflowEvent[], 
  startingBalance: number = 500000
): KpiData['monthlyProjections'] {
  const now = DateTime.now();
  const projections: KpiData['monthlyProjections'] = [];
  let cumulativeLiquidity = startingBalance;
  
  // Generate 12 months of projections
  for (let i = 0; i < 12; i++) {
    const monthStart = now.plus({ months: i }).startOf('month');
    const monthEnd = monthStart.endOf('month');
    const monthName = monthStart.toFormat('MMM yyyy');
    
    // Get events for this month
    const monthEvents = events.filter((event: TimelineCashflowEvent) => 
      event.date >= monthStart && event.date <= monthEnd
    );
    
    // Calculate inflow/outflow
    const inflow = monthEvents
      .filter((e: TimelineCashflowEvent) => e.amount > 0)
      .reduce((sum: number, e: TimelineCashflowEvent) => sum + e.amount, 0);
    const outflow = Math.abs(monthEvents
      .filter((e: TimelineCashflowEvent) => e.amount < 0)
      .reduce((sum: number, e: TimelineCashflowEvent) => sum + e.amount, 0));
    const netFlow = inflow - outflow;
    
    cumulativeLiquidity += netFlow;
    
    projections.push({
      month: monthName,
      inflow,
      outflow,
      netFlow,
      cumulativeLiquidity
    });
  }
  
  return projections;
}

// Calculate project profitability metrics
function calculateProjectProfitability(projects: ProjectData[]): ProjectProfitability[] {
  return projects.map(project => {
    // Calculate total costs
    const purchaseCost = (project.arrasAmount || 0) + (project.outstandingAmount || 0);
    const constructionCost = purchaseCost * 0.5; // Estimate: 50% of purchase price
    const totalCost = purchaseCost + constructionCost;
    
    // Sale price (use actual sold price if available, otherwise planned sale price)
    const salePrice = project.soldPrice || project.salePrice || 0;
    
    // Calculate profitability metrics
    const estimatedProfit = salePrice - totalCost;
    const profitabilityMargin = totalCost > 0 ? salePrice / totalCost : 0;
    const meetsMinimumMargin = profitabilityMargin >= 1.2; // 120% minimum
    
    // Weekly value creation (6 weeks of construction)
    const weeklyValueCreation = estimatedProfit / 6;
    const weeklyValueCreationPercent = totalCost > 0 ? weeklyValueCreation / totalCost : 0;
    
    // Rental metrics for rental properties
    const isRental = project.phase === 'Rent';
    const monthlyRent = 1200; // Estimate
    const yearlyRentalRevenue = isRental ? monthlyRent * 12 : undefined;
    const propertyValue = purchaseCost; // Use purchase price as property value
    const rentalProfitability = isRental && propertyValue > 0 
      ? (yearlyRentalRevenue! / propertyValue) 
      : undefined;
    
    // Status flags
    const isCompleted = ['Completed / Sold', 'Completed / Our Stock'].includes(project.phase);
    
    return {
      projectId: project.id,
      propertyId: project.propertyId,
      name: project.name,
      zone: project.zone,
      phase: project.phase,
      progress: project.progress,
      totalCost,
      salePrice,
      profitabilityMargin,
      estimatedProfit,
      weeklyValueCreation,
      weeklyValueCreationPercent,
      yearlyRentalRevenue,
      rentalProfitability,
      meetsMinimumMargin,
      isRental,
      isCompleted
    };
  });
}

export function useCashflowDashboard() {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateKpis = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch project data using the new service
        const projects = await projectsDataService.parseProjectsData();
        console.log('Parsed projects for cashflow dashboard:', projects.length);
        
        if (projects.length === 0) {
          console.warn('No projects available for KPI calculations');
          setKpiData(null);
          return;
        }

         // Phase capacity calculation
         const phaseCapacity = await calculatePhaseCapacity(DateTime.now());

         // Timeline-based cashflow events
         const cashflowEvents = await projectsDataService.getAllCashflowEvents();
        const currentLiquidity = await projectsDataService.calculateProjectedLiquidity(DateTime.now(), 500000);
        const projectedLiquidityIn30Days = await projectsDataService.calculateProjectedLiquidity(DateTime.now().plus({ days: 30 }), 500000);
        const projectedLiquidityIn90Days = await projectsDataService.calculateProjectedLiquidity(DateTime.now().plus({ days: 90 }), 500000);

        // Calculate financial metrics from projects
        const projectsWithFinancialData = projects.filter((p: ProjectData) => 
          p.arrasAmount && p.outstandingAmount && (p.salePrice || p.soldPrice)
        );

        // Calculate profitability metrics
        const profitabilityMetrics = projectsWithFinancialData.map((p: ProjectData) => {
          const totalCost = (p.arrasAmount || 0) + (p.outstandingAmount || 0) + ((p.arrasAmount || 0) + (p.outstandingAmount || 0)) * 0.5; // Including construction
          const revenue = p.soldPrice || p.salePrice || 0;
          const profit = revenue - totalCost;
          return {
            profit,
            profitMargin: totalCost > 0 ? profit / totalCost : 0,
            totalCost,
            revenue
          };
        });

        const averageProjectProfitability = profitabilityMetrics.length > 0 
          ? profitabilityMetrics.reduce((sum: number, p: any) => sum + p.profitMargin, 0) / profitabilityMetrics.length
          : 0;

        const projectsMeetingMinimumMargin = profitabilityMetrics.filter((p: any) => p.profitMargin >= 0.2).length;
        const totalProjectsMeetingMinimumMargin = profitabilityMetrics.length;

        // Calculate rental profitability
        const rentalProjects = projects.filter((p: ProjectData) => p.phase === 'Rent' || p.phase === 'Rental');
        const averageRentalProfitability = rentalProjects.length > 0 ? 0.08 : 0; // Estimate 8% yield

        // Calculate weekly value creation
        const constructionProjects = projects.filter((p: ProjectData) => p.phase === 'Renovation' || p.phase === 'Construction');
        const weeklyValueCreationData = constructionProjects.map((p: ProjectData) => {
          const totalCost = (p.arrasAmount || 0) + (p.outstandingAmount || 0) + ((p.arrasAmount || 0) + (p.outstandingAmount || 0)) * 0.5;
          const revenue = p.salePrice || p.soldPrice || 0;
          const profit = revenue - totalCost;
          const weeklyValue = profit / 6; // 6 weeks renovation
          const weeklyValuePercent = totalCost > 0 ? (weeklyValue / totalCost) * 100 : 0;
          
          return { weeklyValue, weeklyValuePercent, totalCost };
        });

        const totalWeeklyValueCreation = weeklyValueCreationData.reduce((sum: number, p: any) => sum + p.weeklyValue, 0);
        const averageWeeklyValueCreationPercent = weeklyValueCreationData.length > 0
          ? weeklyValueCreationData.reduce((sum: number, p: any) => sum + p.weeklyValuePercent, 0) / weeklyValueCreationData.length
          : 0;

                 // Calculate project profitability for the interface
         const projectProfitability = calculateProjectProfitability(projects);
         
         // Calculate monthly projections (simplified for now)
         const monthlyProjections = calculateMonthlyProjections([], currentLiquidity);
         
         // Zone breakdown
         const pmiProjects = projects.filter((p: ProjectData) => p.zone === 'PMI').length;
         const mahProjects = projects.filter((p: ProjectData) => p.zone === 'MAH').length;
         
         // Projects completing this/next month (estimate based on progress)
         const projectsCompletingThisMonth = projects.filter((p: ProjectData) => p.progress >= 90).length;
         const projectsCompletingNextMonth = projects.filter((p: ProjectData) => p.progress >= 80 && p.progress < 90).length;

         // Prepare KPI data
         const kpiData: KpiData = {
           // Financial KPIs
           currentLiquidity,
           projectedLiquidityIn30Days,
           projectedLiquidityIn90Days,
           totalProjectedRevenue: profitabilityMetrics.reduce((sum: number, p: any) => sum + p.revenue, 0),
           totalProjectedCosts: profitabilityMetrics.reduce((sum: number, p: any) => sum + p.totalCost, 0),
           netCashflow: profitabilityMetrics.reduce((sum: number, p: any) => sum + p.profit, 0),
           
           // New Financial KPIs from Head of Finance
           averageProjectProfitability,
           projectsMeetingMinimumMargin,
           totalProjectsMeetingMinimumMargin,
           averageRentalProfitability,
           totalWeeklyValueCreation,
           averageWeeklyValueCreationPercent,
           
           // Operational KPIs
           activeProjects: projects.filter((p: ProjectData) => p.phase !== 'Completed / Sold' && p.phase !== 'Rent').length,
           completedProjects: projects.filter((p: ProjectData) => p.phase === 'Completed / Sold').length,
           phaseCapacity,
           
           // Performance metrics
           averageProjectProgress: projects.reduce((sum: number, p: ProjectData) => sum + p.progress, 0) / projects.length,
           projectsCompletingThisMonth,
           projectsCompletingNextMonth,
           
           // Zone breakdown
           pmiProjects,
           mahProjects,
           
           // Detailed analysis
           projectProfitability,
           
           // Timeline data
           cashflowEvents: [], // Will be populated with actual timeline events if needed
           monthlyProjections
         };

        setKpiData(kpiData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate KPIs';
        console.error('Error calculating cashflow KPIs:', err);
        setError(errorMessage);
        
        // Handle authentication errors gracefully
        if (errorMessage.includes('Authentication required')) {
          setError('Please log in to Monday.com to view live KPI data');
        }
      } finally {
        setLoading(false);
      }
    };

    calculateKpis();
  }, []);

  return { kpiData, loading, error };
} 