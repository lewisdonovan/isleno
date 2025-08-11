import { enUS, es } from 'date-fns/locale';

export interface EventStyle {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

export const CALENDAR_LOCALES = {
  'en-US': enUS,
  'es-ES': es,
} as const;

export const CALENDAR_EVENT_STYLES: Record<string, EventStyle> = {
  past_cost: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    color: '#ffffff',
  },
  upcoming_cost: {
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
    color: '#ffffff',
  },
  past_income: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
    color: '#ffffff',
  },
  upcoming_income: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    color: '#ffffff',
  },
}; 