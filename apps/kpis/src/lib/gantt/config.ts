import { DateRange } from '@isleno/types/gantt';

export const GANTT_CONFIG = {
  TASK_LIST_WIDTH: '300px',
  ROW_HEIGHT: 40,
  HEADER_HEIGHT: 60,
  BAR_CORNER_RADIUS: 3,
  HANDLE_WIDTH: 20,
  FONT_SIZE: '12px',
  BAR_FILL: 60,
  MIN_GANTT_HEIGHT: 400,
  MARGIN_WIDTH: 20,
  MIN_COLUMN_WIDTH: 80,
  MAX_COLUMN_WIDTH: 300,
  TARGET_VISIBLE_PERIODS: {
    MIN: 8,
    MAX: 20
  }
} as const;

export const VIEW_MODE_CONFIG = {
  Month: {
    defaultWidth: 120,
    daysPerPeriod: 30,
    navigationIncrement: 3,
    maxDayViewLimit: null
  },
  Week: {
    defaultWidth: 150,
    daysPerPeriod: 7,
    navigationIncrement: 1,
    maxDayViewLimit: null
  },
  Day: {
    defaultWidth: 100,
    daysPerPeriod: 1,
    navigationIncrement: 1,
    maxDayViewLimit: 365
  }
} as const; 