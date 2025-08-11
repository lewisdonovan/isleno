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

// Raw dashboard data from API
export interface RawDashboardData {
  period: string;
  // List of all users to ensure rows for those with zero KPIs
  users: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; title: string }>;
  kpiItemsByGroup: Record<
    string,
    Array<{
      id: string;
      name: string;
      column_values: Array<{ id: string; text: string; value: string }>;
    }>
  >;
  activities: any[];
  pointActivities: any[];
  leads: Array<{
    id: string;
    name: string;
    column_values: Array<{ id: string; text: string; value: string }>;
  }>;
} 