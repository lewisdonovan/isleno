import { DateTime } from 'luxon';
import { Zone, PropertyType } from './calendar';

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
  zone: Zone;
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
  renovationCost?: number; // Total renovation cost from property database
  
  // Calculated cashflow events
  cashflowEvents: CashflowEvent[];
  
  // Phase timeline data
  phaseTimeline?: any[]; // Will be ProjectPhaseTimeline[] from the constants
  currentPhase?: any; // Will be ProjectPhase from the constants
}

// Note: BusinessGanttTask is now exported from @isleno/types/gantt

// Note: GanttProject and GanttMetrics are now exported from @isleno/types/gantt

// Timeline cashflow event type for services
export interface TimelineCashflowEvent {
  id: string;
  projectId: string;
  projectName: string;
  date: DateTime;
  amount: number;
  type: 'purchase_deposit' | 'purchase_final' | 'construction_cost' | 'sale_revenue' | 'rental_income';
  description: string;
  zone: Zone;
  confirmed: boolean;
} 