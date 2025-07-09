import { DateTime } from 'luxon';

// Project stage mapping from Monday.com status indices
export const PROJECT_STAGES = {
  0: 'Construction Preparation',
  1: 'Completed / Our Stock', 
  3: 'Legal',
  4: 'Renovation',
  5: 'Not Started',
  6: 'Completed / Sold',
  7: 'Completed / Reserved Arras',
  8: 'Rent'
} as const;

// Phase mapping for our system
export const PHASE_MAPPING = {
  5: 'Purchase', // Not Started -> Purchase phase
  0: 'Purchase', // Construction Preparation -> Purchase phase
  3: 'Purchase', // Legal -> Purchase phase
  4: 'Construction', // Renovation -> Construction phase
  1: 'Sale/Rental', // Completed / Our Stock -> Sale/Rental phase
  7: 'Sale/Rental', // Completed / Reserved Arras -> Sale/Rental phase
  6: 'Sale/Rental', // Completed / Sold -> Sale/Rental phase
  8: 'Rental' // Rent -> Rental phase
} as const;

// Cashflow event types for project financial modeling
export interface CashflowEvent {
  date: DateTime;
  amount: number; // Positive = inflow, Negative = outflow
  type: 'purchase_deposit' | 'purchase_final' | 'construction_cost' | 'sale_revenue' | 'rental_income';
  description: string;
  projectId: string;
}

// Core project data structure from Monday.com
export interface ProjectData {
  id: string;
  name: string;
  propertyId: string;
  zone: 'PMI' | 'MAH';
  phase: string;
  progress: number; // Extracted from name prefix (e.g., "68%")
  
  // Dates
  arrasSignedDate?: DateTime;
  projectFinishDate?: DateTime;
  latestNotaryDate?: DateTime;
  arrasSoldDate?: DateTime;
  
  // Financial
  arrasAmount?: number;
  outstandingAmount?: number;
  salePrice?: number;
  soldPrice?: number;
  
  // Calculated cashflow events
  cashflowEvents: CashflowEvent[];
}

// Business Gantt Task interface (extending gantt-task-react Task)
export interface BusinessGanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task' | 'project';
  styles?: any;
  project?: string;
  dependencies?: string[];
  hideChildren?: boolean;
  isDisabled?: boolean;
  displayOrder?: number;
  businessData: {
    projectId: string;
    projectName: string;
    zone: 'PMI' | 'MAH';
    propertyType: 'single_unit' | 'multi_unit';
    phase: ProjectData['phase'];
    budget: number;
    spent: number;
    cashFlows: CashflowEvent[];
  };
}

// Gantt project for gantt chart views
export interface GanttProject {
  id: string;
  name: string;
  zone: 'PMI' | 'MAH';
  phase: string;
  progress: number;
  startDate: DateTime;
  endDate: DateTime;
  financials: {
    totalCost: number;
    revenue: number;
    netValue: number;
  };
}

// Gantt metrics for dashboard
export interface GanttMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalCosts: number;
  netValue: number;
  totalActiveBudget: number;
  averageProjectDuration: number;
  capacityUtilization: {
    purchase: number;
    construction: number;
    sale: number;
  };
} 