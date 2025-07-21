import type { Database } from '@isleno/types/db/public';

export type KpiSnapshotConfig = Database['public']['Tables']['kpi_snapshot_configs']['Row'];

export type KpiTransformArgs = {
  rawData: any; // Monday GraphQL result
  config: KpiSnapshotConfig; // Row from Supabase
  date: string; // ISO date string for the snapshot
};

export type KpiTransformFn = (args: KpiTransformArgs) => Promise<number>;

export type TransformRegistry = Record<string, KpiTransformFn>; 