import { ViewMode } from "gantt-task-react";

/**
 * Gantt chart dimensions and styling constants
 */
export const GANTT_CONFIG = {
  // Layout dimensions
  TASK_LIST_WIDTH: "200px",
  ROW_HEIGHT: 32,
  HEADER_HEIGHT: 32,
  MIN_GANTT_HEIGHT: 350,
  
  // Styling
  BAR_CORNER_RADIUS: 2,
  HANDLE_WIDTH: 4,
  FONT_SIZE: "12",
  BAR_FILL: 45,
  
  // Layout calculations
  SCROLLBAR_WIDTH: 20,
  MARGIN_WIDTH: 20,
  MIN_COLUMN_WIDTH: 60,
  MAX_COLUMN_WIDTH: 300,
  TARGET_VISIBLE_PERIODS: {
    MIN: 8,
    MAX: 12
  }
} as const;

/**
 * Default column widths for different view modes
 */
export const DEFAULT_COLUMN_WIDTHS = {
  [ViewMode.Month]: 120,
  [ViewMode.Week]: 150,
  [ViewMode.Day]: 200,
} as const;

/**
 * View mode configurations
 */
export const VIEW_MODE_CONFIG = {
  [ViewMode.Month]: {
    defaultWidth: 120,
    daysPerPeriod: 30,
    navigationIncrement: 3, // months
    maxDayViewLimit: null
  },
  [ViewMode.Week]: {
    defaultWidth: 150,
    daysPerPeriod: 7,
    navigationIncrement: 1, // months
    maxDayViewLimit: null
  },
  [ViewMode.Day]: {
    defaultWidth: 200,
    daysPerPeriod: 1,
    navigationIncrement: 0.25, // months
    maxDayViewLimit: 60 // limit for performance
  }
} as const; 