import { DateTime } from 'luxon';
import { SupportedLocale } from '@/types/calendar';

/**
 * Format currency based on locale
 */
export const formatCurrency = (amount: number, currency: string = 'EUR', locale: SupportedLocale = 'en') => {
  const localeString = locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency: currency,
    notation: amount > 1000000 ? 'compact' : 'standard',
  }).format(amount);
};

/**
 * Format date range for display
 */
export const formatDateRange = (start: DateTime, end: DateTime, locale: SupportedLocale = 'en') => {
  const format = locale === 'es' ? "dd/MM/yyyy" : "MM/dd/yyyy";
  return `${start.toFormat(format)} - ${end.toFormat(format)}`;
};

/**
 * Format date for task duration display
 */
export const formatTaskDuration = (start: Date, end: Date) => {
  return `${DateTime.fromJSDate(start).toFormat('MMM dd')} - ${DateTime.fromJSDate(end).toFormat('MMM dd')}`;
}; 