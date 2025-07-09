import { DateTime } from 'luxon';
import { DateRange, PhaseCapacity } from '@/types/gantt';
import { projectsDataService } from '@/lib/services/projectsDataService';
import { 
  fetchGanttProjects as fetchGanttProjectsFromService, 
  fetchGanttTasks as fetchGanttTasksFromService, 
  fetchGanttMetrics as fetchGanttMetricsFromService
} from '@/lib/services/ganttService';
import { ProjectData, GanttProject, GanttMetrics, BusinessGanttTask } from '@/types/projects';

// Re-export phase colors for backward compatibility
export { PHASE_COLORS } from '@/lib/constants/projectConstants';

// Default date range helper
export function getDefaultDateRange(): DateRange {
  const now = DateTime.now();
  return {
    start: now.minus({ months: 6 }).startOf('month'),
    end: now.plus({ months: 12 }).endOf('month')
  };
}

// Business logic functions for fetching Gantt data
export async function fetchGanttProjects(dateRange: DateRange): Promise<GanttProject[]> {
  // Use the service functions which work with live API data
  return await fetchGanttProjectsFromService(dateRange);
}

export async function fetchGanttTasks(
  dateRange: DateRange, 
  projectCollapseStates: Record<string, boolean> = {}
): Promise<BusinessGanttTask[]> {
  // Use the service functions which work with live API data
  return await fetchGanttTasksFromService(dateRange, projectCollapseStates);
}

export async function fetchGanttMetrics(dateRange: DateRange): Promise<GanttMetrics> {
  // Use the service functions which work with live API data
  return await fetchGanttMetricsFromService(dateRange);
}

// Calculate phase capacity utilization
export function calculatePhaseCapacity(_targetDate: DateTime = DateTime.now()): PhaseCapacity[] {
  // TODO: Implement real calculation logic
  return [
    {
      type: 'purchase',
      current: 0,
      maximum: 10,
      projects: []
    },
    {
      type: 'construction', 
      current: 0,
      maximum: 5,
      projects: []
    },
    {
      type: 'sale',
      current: 0,
      maximum: 8,
      projects: []
    }
  ];
}

// Timeline-based project phases from keys date
export interface ProjectTimeline {
  keysDate: DateTime;
  legalPurchase: DateTime;    // keys + 3 weeks
  constructionPrep: DateTime;  // keys + 5 weeks
  construction: DateTime;      // keys + 11 weeks
  sale: DateTime;             // keys + 14 weeks
  legalSale: DateTime;        // keys + 16 weeks
}

// Timeline-based cashflow event generation
export interface TimelineCashflowEvent {
  date: DateTime;
  amount: number; // Positive = inflow, Negative = outflow
  type: 'purchase_deposit' | 'purchase_final' | 'construction_prep' | 'construction_payment' | 'sale_revenue' | 'legal_fees';
  description: string;
  projectId: string;
  projectName: string;
  phase: string;
}

// Generate project timeline from keys date
function generateProjectTimeline(keysDate: DateTime): ProjectTimeline {
  return {
    keysDate,
    legalPurchase: keysDate.plus({ weeks: 3 }),
    constructionPrep: keysDate.plus({ weeks: 5 }),
    construction: keysDate.plus({ weeks: 11 }),
    sale: keysDate.plus({ weeks: 14 }),
    legalSale: keysDate.plus({ weeks: 16 })
  };
}

// Generate timeline-based cashflow events for a project
function generateTimelineBasedCashflow(project: {
  id: string;
  name: string;
  keysDate?: DateTime;
  arrasAmount?: number;
  outstandingAmount?: number;
  salePrice?: number;
  phase: string;
}): TimelineCashflowEvent[] {
  const events: TimelineCashflowEvent[] = [];
  
  // Use keys date if available, otherwise estimate based on current phase
  const keysDate = project.keysDate || estimateKeysDate(project.phase);
  const timeline = generateProjectTimeline(keysDate);
  
  const arrasAmount = project.arrasAmount || 0;
  const outstandingAmount = project.outstandingAmount || 0;
  const salePrice = project.salePrice || 0;
  const constructionCost = (arrasAmount + outstandingAmount) * 0.5; // 50% of purchase price
  
  // Purchase deposit (at keys date)
  if (arrasAmount > 0) {
    events.push({
      date: timeline.keysDate,
      amount: -arrasAmount,
      type: 'purchase_deposit',
      description: `Purchase deposit - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Purchase'
    });
  }
  
  // Final purchase payment (legal completion)
  if (outstandingAmount > 0) {
    events.push({
      date: timeline.legalPurchase,
      amount: -outstandingAmount,
      type: 'purchase_final',
      description: `Final purchase payment - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Legal Purchase'
    });
  }
  
  // Construction preparation costs (5% of construction cost)
  if (constructionCost > 0) {
    events.push({
      date: timeline.constructionPrep,
      amount: -(constructionCost * 0.05),
      type: 'construction_prep',
      description: `Construction preparation - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Construction Prep'
    });
  }
  
  // Main construction payment (remaining 95% of construction cost)
  if (constructionCost > 0) {
    events.push({
      date: timeline.construction,
      amount: -(constructionCost * 0.95),
      type: 'construction_payment',
      description: `Construction payment - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Construction'
    });
  }
  
  // Sale revenue (main income)
  if (salePrice > 0) {
    events.push({
      date: timeline.sale,
      amount: salePrice,
      type: 'sale_revenue',
      description: `Sale revenue - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Sale'
    });
  }
  
  // Legal fees for sale (2% of sale price)
  if (salePrice > 0) {
    events.push({
      date: timeline.legalSale,
      amount: -(salePrice * 0.02),
      type: 'legal_fees',
      description: `Legal fees for sale - ${project.name}`,
      projectId: project.id,
      projectName: project.name,
      phase: 'Legal Sale'
    });
  }
  
  return events;
}

// Estimate keys date based on current project phase
function estimateKeysDate(phase: string): DateTime {
  const now = DateTime.now();
  
  // Map phases to estimated weeks since keys date
  const phaseOffsets: Record<string, number> = {
    'Purchase': -1,              // Keys happened 1 week ago
    'Legal': 3,                  // We're at legal phase (keys + 3 weeks)
    'Construction': 8,           // We're in construction (somewhere between weeks 5-11)
    'Renovation': 8,
    'Sale': 14,                  // We're at sale phase
    'Completed / Sold': 16,      // Project completed
    'Completed / Our Stock': 16,
    'Rent': 16                   // Rental property (construction done)
  };
  
  const offset = phaseOffsets[phase] || 0;
  return now.minus({ weeks: offset });
}

// Get all timeline-based cashflow events
export async function getAllTimelineBasedCashflowEvents(): Promise<TimelineCashflowEvent[]> {
  const projects = await projectsDataService.parseProjectsData();
  
  return projects.flatMap((project: ProjectData) => 
    generateTimelineBasedCashflow({
      id: project.id,
      name: project.name,
      keysDate: project.arrasSignedDate, // Use arras signed date as proxy for keys date
      arrasAmount: project.arrasAmount,
      outstandingAmount: project.outstandingAmount,
      salePrice: project.salePrice,
      phase: project.phase
    })
  );
}

// Calculate projected liquidity using timeline-based events
export async function calculateTimelineBasedLiquidity(targetDate: DateTime, startingBalance: number = 500000): Promise<number> {
  const events = await getAllTimelineBasedCashflowEvents();
  const relevantEvents = events.filter(event => event.date <= targetDate);
  
  return relevantEvents.reduce((balance, event) => balance + event.amount, startingBalance);
} 