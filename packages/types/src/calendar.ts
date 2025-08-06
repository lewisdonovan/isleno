import { DateTime } from 'luxon';

// Business phases
export type Phase = 'purchase' | 'construction' | 'sale' | 'rental';

// Geographic zones
export type Zone = 'PMI' | 'MAH' | 'IBZ'; // Palma, Menorca, Ibiza

// Property types
export type PropertyType = 'single_unit' | 'multi_unit';

// Event categories
export type EventCategory = 'purchase' | 'construction' | 'sale' | 'rental';

// Event types for different financial flows
export type EventType = 'past_cost' | 'upcoming_cost' | 'past_income' | 'upcoming_income';

// Calendar event data structure
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  amount: number;
  currency: string;
  metadata: {
    zone: Zone;
    propertyId: string;
    propertyType: PropertyType;
    category: EventCategory;
    phase: Phase;
    description?: string;
  };
}

// Business metrics for capacity tracking
export interface BusinessMetrics {
  date: DateTime;
  phaseSlots: {
    purchase: { used: number; total: number };
    construction: { used: number; total: number };
    sale: { used: number; total: number };
  };
  liquidity: number;
  rentalIncome: number;
  fixedCosts: number;
}

// Query types for future forecasting
export interface ForecastQuery {
  date: DateTime;
  zone?: Zone;
  propertyType?: PropertyType;
}

// Locale settings
export type SupportedLocale = 'en' | 'es';

export interface LocaleSettings {
  locale: SupportedLocale;
  currency: string;
  dateFormat: string;
} 