// Legacy format for gantt components (with bg/text structure)
export const PHASE_COLORS = {
  purchase: { bg: '#3b82f6', text: '#ffffff' },      // Blue
  construction: { bg: '#f59e0b', text: '#ffffff' },   // Amber/Orange
  sale: { bg: '#10b981', text: '#ffffff' },           // Emerald/Green
  rental: { bg: '#8b5cf6', text: '#ffffff' }          // Purple
} as const;

// Direct color lookup for styling (string values only)
export const PHASE_COLOR_MAP = {
  'Purchase': '#3b82f6',
  'Construction': '#f59e0b',
  'Sale/Rental': '#10b981',
  'Rental': '#8b5cf6',
  'Legal': '#6366f1',
  'Not Started': '#6b7280',
  'Completed / Sold': '#059669',
  'Completed / Our Stock': '#047857',
  'Completed / Reserved Arras': '#065f46',
  'Renovation': '#d97706',
  'Construction Preparation': '#92400e',
  'Rent': '#7c3aed'
} as const;

// Default project capacities by phase
export const PHASE_CAPACITIES = {
  Purchase: 4,
  Construction: 4,
  'Sale/Rental': 4
} as const;

// Estimation constants for financial calculations
export const FINANCIAL_ESTIMATES = {
  CONSTRUCTION_COST_RATIO: 0.5, // 50% of purchase price
  RENOVATION_WEEKS: 6,           // Standard renovation duration
  MONTHLY_RENT_ESTIMATE: 1200,   // Default monthly rent
  PURCHASE_TO_NOTARY_DAYS: 30,   // Days from arras to notary
  ARRAS_TO_CONSTRUCTION_DAYS: 60 // Days from arras to construction start
} as const; 