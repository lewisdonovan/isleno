import { ChartConfig } from "@/components/ui/chart";

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
  previousValue: {
    label: "Previous",
    color: "hsl(var(--chart-2))",
  },
} as const;

export const CASHFLOW_CHART_CONFIG: ChartConfig = {
  inflow: {
    label: "Inflow",
    color: "hsl(var(--chart-1))",
  },
  outflow: {
    label: "Outflow", 
    color: "hsl(var(--chart-2))",
  },
  netFlow: {
    label: "Net Flow",
    color: "hsl(var(--chart-3))",
  },
  cumulativeLiquidity: {
    label: "Cumulative Liquidity",
    color: "hsl(var(--chart-4))",
  },
} as const;

export const UPCOMING_EVENTS_CHART_CONFIG: ChartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
} as const;

export const KPI_TIMESERIES_CHART_CONFIG: ChartConfig = {
  current: {
    label: "Current Period",
    color: "hsl(var(--chart-1))",
  },
  previous: {
    label: "Previous Period", 
    color: "hsl(var(--chart-2))",
  },
} as const; 