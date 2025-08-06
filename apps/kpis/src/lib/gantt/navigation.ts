import { DateTime } from 'luxon';
import { DateRange } from '@isleno/types/gantt';

export function navigateDateRange(
  dateRange: DateRange, 
  direction: 'prev' | 'next', 
  viewMode: string
): DateRange {
  const amount = viewMode === 'Month' ? 1 : 
                viewMode === 'Week' ? 1 : 
                3; // QuarterDay
  const unit = viewMode === 'Month' ? 'month' : 
               viewMode === 'Week' ? 'week' : 
               'month';

  if (direction === 'prev') {
    return {
      start: dateRange.start.minus({ [unit]: amount }),
      end: dateRange.end.minus({ [unit]: amount })
    };
  } else {
    return {
      start: dateRange.start.plus({ [unit]: amount }),
      end: dateRange.end.plus({ [unit]: amount })
    };
  }
}

export function resetToCurrentPeriod(viewMode: string): DateRange {
  const now = DateTime.now();
  
  switch (viewMode) {
    case 'Month':
      return {
        start: now.minus({ months: 6 }).startOf('month'),
        end: now.plus({ months: 12 }).endOf('month')
      };
    case 'Week':
      return {
        start: now.minus({ weeks: 8 }).startOf('week'),
        end: now.plus({ weeks: 16 }).endOf('week')
      };
    default: // QuarterDay
      return {
        start: now.minus({ months: 3 }).startOf('month'),
        end: now.plus({ months: 6 }).endOf('month')
      };
  }
}

export function createYearRange(): DateRange {
  const now = DateTime.now();
  return {
    start: now.startOf('year'),
    end: now.endOf('year')
  };
}

export function createMonthRange(beforeMonths: number, afterMonths: number): DateRange {
  const now = DateTime.now();
  return {
    start: now.minus({ months: beforeMonths }).startOf('month'),
    end: now.plus({ months: afterMonths }).endOf('month')
  };
} 