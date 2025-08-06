export interface DateRangePreset {
  label: string;
  days: number;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: "Last 90 days", days: 90 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 30 days", days: 30 },
];

export const DEFAULT_DATE_RANGE_DAYS = 90; 