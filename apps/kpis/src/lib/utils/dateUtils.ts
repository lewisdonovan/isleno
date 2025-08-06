export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DatePreset {
  label: string;
  days: number;
}

export class DateUtils {
  /**
   * Formats a date to YYYY-MM-DD format for database storage
   */
  static formatDateForDB(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Calculates a date range going back N days from today
   */
  static getDateRangeFromDays(days: number): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return {
      startDate: this.formatDateForDB(startDate),
      endDate: this.formatDateForDB(endDate)
    };
  }

  /**
   * Gets default date range (60 days back from today)
   */
  static getDefaultDateRange(): DateRange {
    return this.getDateRangeFromDays(60);
  }

  /**
   * Validates that start date is not after end date
   */
  static validateDateRange(startDate: string, endDate: string): boolean {
    return new Date(startDate) <= new Date(endDate);
  }

  /**
   * Adjusts end date if it's before start date
   */
  static adjustEndDateIfNeeded(startDate: string, endDate: string): string {
    return new Date(startDate) > new Date(endDate) ? startDate : endDate;
  }

  /**
   * Adjusts start date if it's after end date
   */
  static adjustStartDateIfNeeded(startDate: string, endDate: string): string {
    return new Date(endDate) < new Date(startDate) ? endDate : startDate;
  }

  /**
   * Common date range presets
   */
  static readonly PRESETS: DatePreset[] = [
    { label: "Last 90 days", days: 90 },
    { label: "Last 60 days", days: 60 },
    { label: "Last 30 days", days: 30 },
  ];

  /**
   * Creates a date range from a preset
   */
  static getPresetDateRange(preset: DatePreset): DateRange {
    return this.getDateRangeFromDays(preset.days);
  }
} 