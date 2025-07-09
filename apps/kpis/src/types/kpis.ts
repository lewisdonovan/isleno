export interface Kpi {
  id: string;
  key: string;
  title: string;
  count: number;
}

export interface Closer {
  id: number;
  name: string;
  kpis: Kpi[];
}

export interface DashboardData {
  closers: Closer[];
  kpiObjectives: Record<string, number>;
}