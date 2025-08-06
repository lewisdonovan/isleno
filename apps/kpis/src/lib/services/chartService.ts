import type { Database } from "@isleno/types/db/public";

export interface ChartDataPoint {
  date: string;
  value: number;
  fullDate: string;
}

export interface CsvRow {
  date: string;
  value: number | null;
  kpi_id: string;
  kpi_name: string;
  channel: string;
  unit: string;
}

export class ChartService {
  /**
   * Processes snapshots into chart data points
   */
  static processSnapshotsToChartData(
    snapshots: Database['public']['Tables']['snapshots']['Row'][]
  ): ChartDataPoint[] {
    return snapshots
      .filter(snapshot => snapshot.numeric_value !== null)
      .map(snapshot => ({
        date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: '2-digit' 
        }),
        value: snapshot.numeric_value!,
        fullDate: snapshot.snapshot_date,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }

  /**
   * Calculates percentage change between first and last data points
   */
  static calculatePercentageChange(chartData: ChartDataPoint[]): number | null {
    if (chartData.length < 2) return null;
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    
    if (firstValue === null || lastValue === null || firstValue === 0) return null;
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  /**
   * Prepares CSV data for export
   */
  static prepareCsvData(
    snapshots: Database['public']['Tables']['snapshots']['Row'][],
    kpi: Database['public']['Tables']['kpis']['Row']
  ): CsvRow[] {
    return snapshots.map(snapshot => ({
      date: snapshot.snapshot_date,
      value: snapshot.numeric_value,
      kpi_id: snapshot.kpi_id,
      kpi_name: kpi.kpi_name,
      channel: kpi.channel || '',
      unit: kpi.unit_of_measure || '',
    }));
  }

  /**
   * Generates a safe filename from KPI name
   */
  static generateSafeFilename(kpiName: string): string {
    return kpiName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  }

  /**
   * Formats chart tooltip value with unit
   */
  static formatTooltipValue(
    value: number, 
    kpiName: string, 
    unit?: string
  ): [string, string] {
    const formattedValue = `${value}${unit ? ` ${unit}` : ''}`;
    return [formattedValue, kpiName];
  }

  /**
   * Formats Y-axis tick values with unit
   */
  static formatYAxisTick(value: number, unit?: string): string {
    return `${value}${unit ? ` ${unit}` : ''}`;
  }
} 