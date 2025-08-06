import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { fetchCalendarEvents } from '@/lib/calendar/mockData';
import { CalendarEvent } from '@isleno/types/calendar';

export function useCalendarEvents(startDate: DateTime, endDate: DateTime) {
  return useQuery<CalendarEvent[], Error>({
    queryKey: ['calendar-events', startDate.toISODate(), endDate.toISODate()],
    queryFn: () => fetchCalendarEvents(startDate, endDate),
    enabled: startDate.isValid && endDate.isValid && startDate < endDate,
  });
}

// Hook for getting events within a specific month
export function useMonthlyEvents(date: DateTime) {
  const startOfMonth = date.startOf('month').minus({ weeks: 1 }); // Include previous week for month view
  const endOfMonth = date.endOf('month').plus({ weeks: 1 }); // Include next week for month view
  
  return useCalendarEvents(startOfMonth, endOfMonth);
}

// Hook for getting events within a specific week
export function useWeeklyEvents(date: DateTime) {
  const startOfWeek = date.startOf('week');
  const endOfWeek = date.endOf('week');
  
  return useCalendarEvents(startOfWeek, endOfWeek);
}

// Hook for getting events for a specific day
export function useDailyEvents(date: DateTime) {
  const startOfDay = date.startOf('day');
  const endOfDay = date.endOf('day');
  
  return useCalendarEvents(startOfDay, endOfDay);
} 