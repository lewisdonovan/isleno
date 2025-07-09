import { ViewMode } from "gantt-task-react";
import { DateTime } from 'luxon';
import { DateRange } from '@/types/gantt';
import { VIEW_MODE_CONFIG } from './config';

/**
 * Navigate date range in the specified direction
 */
export const navigateDateRange = (
  currentRange: DateRange, 
  direction: 'prev' | 'next', 
  viewMode: ViewMode
): DateRange => {
  const viewConfig = VIEW_MODE_CONFIG[viewMode as keyof typeof VIEW_MODE_CONFIG];
  const months = viewConfig?.navigationIncrement || 1;
  
  const delta = direction === 'next' ? months : -months;
  
  return {
    start: currentRange.start.plus({ months: delta }),
    end: currentRange.end.plus({ months: delta })
  };
};

/**
 * Reset date range to current period (6 months before to 12 months after current date)
 */
export const resetToCurrentPeriod = (): DateRange => {
  const now = DateTime.now();
  return {
    start: now.minus({ months: 6 }).startOf('month'),
    end: now.plus({ months: 12 }).endOf('month')
  };
};

/**
 * Create date range for this year
 */
export const createYearRange = (): DateRange => {
  const now = DateTime.now();
  return {
    start: now.startOf('year'),
    end: now.endOf('year')
  };
};

/**
 * Create date range for specified number of months around current date
 */
export const createMonthRange = (monthsBefore: number, monthsAfter: number): DateRange => {
  const now = DateTime.now();
  return {
    start: now.minus({ months: monthsBefore }).startOf('month'),
    end: now.plus({ months: monthsAfter }).endOf('month')
  };
}; 