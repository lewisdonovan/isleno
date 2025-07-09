import { DateTime } from 'luxon';
import { CalendarEvent, EventType, Zone, PropertyType, EventCategory, Phase } from '@/types/calendar';

// Sample property data
const PROPERTIES = [
  { id: 'PLOT_14', type: 'single_unit' as PropertyType, zone: 'PMI' as Zone, name: 'Plot 14' },
  { id: 'APTO_BELLVER', type: 'multi_unit' as PropertyType, zone: 'PMI' as Zone, name: 'Apto Bellver' },
  { id: 'APTO_SOL_MAR', type: 'single_unit' as PropertyType, zone: 'MAH' as Zone, name: 'Apto Sol y Mar' },
  { id: 'ROOM_2_PLOT_16', type: 'multi_unit' as PropertyType, zone: 'PMI' as Zone, name: 'Room 2, Plot 16' },
  { id: 'VILLA_PALMA', type: 'single_unit' as PropertyType, zone: 'PMI' as Zone, name: 'Villa Palma' },
  { id: 'MENORCA_TOWER', type: 'multi_unit' as PropertyType, zone: 'MAH' as Zone, name: 'Menorca Tower' },
];

// Event type configurations
const EVENT_CONFIGS = {
  past_cost: {
    icon: '💸',
    baseTitle: 'Construction Payment',
    phase: 'construction' as Phase,
    category: 'construction' as EventCategory,
  },
  upcoming_cost: {
    icon: '📉',
    baseTitle: 'Supplier Invoice Due',
    phase: 'construction' as Phase,
    category: 'construction' as EventCategory,
  },
  past_income: {
    icon: '💰',
    baseTitle: 'Sale Closed',
    phase: 'sale' as Phase,
    category: 'sale' as EventCategory,
  },
  upcoming_income: {
    icon: '📈',
    baseTitle: 'Expected Rental Payment',
    phase: 'rental' as Phase,
    category: 'rental' as EventCategory,
  },
};

function generateRandomAmount(type: EventType): number {
  const ranges = {
    past_cost: [15000, 85000],
    upcoming_cost: [8000, 45000],
    past_income: [120000, 750000],
    upcoming_income: [1200, 3500],
  };
  
  const [min, max] = ranges[type];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate(baseDate: DateTime, daysRange: number): Date {
  const randomDays = Math.floor(Math.random() * daysRange) - Math.floor(daysRange / 2);
  return baseDate.plus({ days: randomDays }).toJSDate();
}

export function generateMockEvents(startDate: DateTime, endDate: DateTime): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const totalDays = endDate.diff(startDate, 'days').days;
  const eventsPerWeek = 8; // Average events per week
  const totalEvents = Math.floor((totalDays / 7) * eventsPerWeek);

  for (let i = 0; i < totalEvents; i++) {
    const eventType = Object.keys(EVENT_CONFIGS)[Math.floor(Math.random() * 4)] as EventType;
    const property = PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)];
    const config = EVENT_CONFIGS[eventType];
    
    // Generate dates - past events before today, future events after today
    const now = DateTime.now();
    let eventDate: Date;
    
    if (eventType.includes('past')) {
      // Past events: between startDate and today
      const pastRange = now.diff(startDate, 'days').days;
      eventDate = generateRandomDate(startDate, pastRange);
    } else {
      // Future events: between today and endDate
      const futureRange = endDate.diff(now, 'days').days;
      eventDate = generateRandomDate(now, futureRange);
    }

    const amount = generateRandomAmount(eventType);
    
    const event: CalendarEvent = {
      id: `event_${i}_${Date.now()}`,
      title: `${config.icon} ${config.baseTitle}: ${property.name}`,
      start: eventDate,
      end: eventDate, // Single day events
      type: eventType,
      amount,
      currency: 'EUR',
      metadata: {
        zone: property.zone,
        propertyId: property.id,
        propertyType: property.type,
        category: config.category,
        phase: config.phase,
        description: `${config.baseTitle} for ${property.name} in ${property.zone}`,
      },
    };

    events.push(event);
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Mock API function that simulates data fetching
export async function fetchCalendarEvents(startDate: DateTime, endDate: DateTime): Promise<CalendarEvent[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  
  return generateMockEvents(startDate, endDate);
}

// Generate mock business metrics
export function generateMockMetrics(date: DateTime) {
  return {
    date,
    phaseSlots: {
      purchase: { used: 2, total: 3 },
      construction: { used: 3, total: 3 },
      sale: { used: 1, total: 3 },
    },
    liquidity: 450000 + Math.random() * 200000,
    rentalIncome: 8500 + Math.random() * 2000,
    fixedCosts: 12000 + Math.random() * 1000,
  };
} 