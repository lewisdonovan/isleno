import type { Database } from "@isleno/types/db/public";

export interface BiggestMover {
  kpi: Database['public']['Tables']['kpis']['Row'];
  percentageChange: number;
  hasData: boolean;
}

export class KpiCategoryService {
  /**
   * Fetches snapshots for given KPI IDs within a date range
   */
  static async fetchSnapshots(
    kpiIds: string[], 
    startDate: string, 
    endDate: string
  ): Promise<Database['public']['Tables']['snapshots']['Row'][]> {
    if (kpiIds.length === 0) return [];

    const params = new URLSearchParams({
      kpiIds: kpiIds.join(','),
      startDate,
      endDate
    });

    const response = await fetch(`/api/kpis/snapshots?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.data || [];
  }

  /**
   * Calculates the biggest movers based on percentage change
   */
  static calculateBiggestMovers(
    kpis: Database['public']['Tables']['kpis']['Row'][],
    snapshots: Database['public']['Tables']['snapshots']['Row'][],
    limit: number = 3
  ): BiggestMover[] {
    return kpis.map(kpi => {
      const kpiSnapshots = snapshots.filter(s => s.kpi_id === kpi.kpi_id);
      const chartData = kpiSnapshots
        .filter(snapshot => snapshot.numeric_value !== null)
        .map(snapshot => ({
          date: snapshot.snapshot_date,
          value: snapshot.numeric_value!,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let percentageChange = null;
      if (chartData.length >= 2) {
        const firstValue = chartData[0].value;
        const lastValue = chartData[chartData.length - 1].value;
        if (firstValue !== null && lastValue !== null && firstValue !== 0) {
          percentageChange = ((lastValue - firstValue) / firstValue) * 100;
        }
      }

      return {
        kpi,
        percentageChange: percentageChange || 0,
        hasData: chartData.length > 0
      };
    })
    .filter(item => item.hasData && item.percentageChange !== null)
    .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
    .slice(0, limit);
  }

  /**
   * Prepares CSV data for export
   */
  static prepareCsvData(
    kpis: Database['public']['Tables']['kpis']['Row'][],
    snapshots: Database['public']['Tables']['snapshots']['Row'][]
  ) {
    const csvData: Array<{
      date: string;
      kpi_name: string;
      channel: string;
      value: number | null;
      unit: string;
      kpi_id: string;
    }> = [];

    snapshots.forEach(snapshot => {
      const kpi = kpis.find(k => k.kpi_id === snapshot.kpi_id);
      if (kpi) {
        csvData.push({
          date: snapshot.snapshot_date,
          kpi_name: kpi.kpi_name,
          channel: kpi.channel || '',
          value: snapshot.numeric_value,
          unit: kpi.unit_of_measure || '',
          kpi_id: snapshot.kpi_id
        });
      }
    });

    return csvData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Gets available channels from KPIs
   */
  static getAvailableChannels(kpis: Database['public']['Tables']['kpis']['Row'][]): string[] {
    const channels = new Set(kpis.map(kpi => kpi.channel).filter(Boolean));
    return Array.from(channels).sort();
  }

  /**
   * Filters KPIs by selected channels
   */
  static filterKpisByChannels(
    kpis: Database['public']['Tables']['kpis']['Row'][], 
    selectedChannels: string[]
  ): Database['public']['Tables']['kpis']['Row'][] {
    if (selectedChannels.length === 0) return kpis;
    return kpis.filter(kpi => selectedChannels.includes(kpi.channel));
  }
} 