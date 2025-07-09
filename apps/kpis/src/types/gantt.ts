import { DateTime } from 'luxon';
import { Zone, PropertyType, SupportedLocale } from './calendar';

// Project status
export type ProjectStatus = 'planned' | 'active' | 'delayed' | 'completed' | 'on-hold';

// Phase with timeline information
export interface ProjectPhase {
  id: string;
  type: 'purchase' | 'construction' | 'sale' | 'rental';
  name: string;
  startDate: DateTime;
  endDate: DateTime;
  status: ProjectStatus;
  progress: number; // 0-100
  budget: number;
  spent: number;
  dependencies?: string[]; // IDs of phases this depends on
}

// Cash flow events tied to specific dates
export interface CashFlowEvent {
  id: string;
  date: DateTime;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: 'purchase' | 'construction' | 'sale' | 'rental' | 'maintenance' | 'legal';
  confirmed: boolean; // true for past/confirmed, false for projected
}

// Complete project with all phases and cash flows
export interface GanttProject {
  id: string;
  name: string;
  zone: Zone;
  propertyType: PropertyType;
  totalBudget: number;
  expectedReturn: number;
  startDate: DateTime;
  expectedEndDate: DateTime;
  actualEndDate?: DateTime;
  status: ProjectStatus;
  phases: ProjectPhase[];
  cashFlows: CashFlowEvent[];
  metadata: {
    address?: string;
    units?: number;
    squareMeters?: number;
    notes?: string;
  };
}

// Gantt Task format for react-gantt-task library
export interface GanttTask {
  start: Date;
  end: Date;
  name: string;
  id: string;
  type: 'task' | 'milestone' | 'project';
  progress: number;
  isDisabled?: boolean;
  styles?: {
    backgroundColor?: string;
    backgroundSelectedColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
  project?: string;
  dependencies?: string[];
  hideChildren?: boolean;
  displayOrder?: number;
}

// Extended task with business metadata
export interface BusinessGanttTask extends GanttTask {
  businessData: {
    projectId: string;
    projectName: string;
    zone: Zone;
    propertyType: PropertyType;
    phase: ProjectPhase;
    budget: number;
    spent: number;
    cashFlows: CashFlowEvent[];
  };
}

// Capacity tracking for each phase type
export interface PhaseCapacity {
  type: 'purchase' | 'construction' | 'sale';
  current: number;
  maximum: number;
  projects: string[]; // Project IDs currently in this phase
}

// Business metrics for Gantt view
export interface GanttMetrics {
  date: DateTime;
  phaseCapacities: PhaseCapacity[];
  totalActiveBudget: number;
  projectedCashFlow: {
    thisMonth: number;
    nextMonth: number;
    nextQuarter: number;
  };
  completedProjects: number;
  averageProjectDuration: number; // in months
}

// Timeline view configuration
export interface GanttViewConfig {
  startDate: DateTime;
  endDate: DateTime;
  timeScale: 'month' | 'quarter' | 'year';
  showCashFlow: boolean;
  showCapacity: boolean;
  groupBy: 'phase' | 'zone' | 'property-type';
  locale: SupportedLocale;
}

// View mode options for react-gantt-task
export type ViewMode = 'Hour' | 'QuarterDay' | 'HalfDay' | 'Day' | 'Week' | 'Month' | 'QuarterYear' | 'Year';

// Column options for the table
export interface ColumnOption {
  name: string;
  label: string;
  width: number;
}

// Timeline item for rendering
export interface TimelineItem {
  id: string;
  projectId: string;
  projectName: string;
  phase: ProjectPhase;
  rowIndex: number;
  startX: number;
  width: number;
  color: string;
  textColor: string;
}

// Date range for filtering and queries
export interface DateRange {
  start: DateTime;
  end: DateTime;
} 