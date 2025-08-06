"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import type { Database } from "@isleno/types/db/public";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { arrayToCsv, downloadStringAsFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Download } from "lucide-react";
import { ChartService } from "@/lib/services/chartService";
import { KPI_TIMESERIES_CHART_CONFIG } from '@/configs/charts';

type Kpi = Database['public']['Tables']['kpis']['Row'];
type Snapshot = Database['public']['Tables']['snapshots']['Row'];

interface KpiTimeSeriesChartProps {
  kpi: Kpi;
  snapshots: Snapshot[];
  loading?: boolean;
}

export default function KpiTimeSeriesChart({ kpi, snapshots, loading = false }: KpiTimeSeriesChartProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filename, setFilename] = useState(ChartService.generateSafeFilename(kpi.kpi_name));

  const chartData = ChartService.processSnapshotsToChartData(snapshots);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-full w-full min-h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  if (!loading && chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {`${kpi.kpi_name}${kpi.channel ? ` (${kpi.channel})` : ``}`}
          </CardTitle>
          {kpi.description && (
            <CardDescription className="text-xs line-clamp-2">{kpi.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-muted-foreground">
            <p>No numeric data available for charting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentageChange = ChartService.calculatePercentageChange(chartData);

  const handleDownload = () => {
    const csvRows = ChartService.prepareCsvData(snapshots, kpi);
    const csv = arrayToCsv(csvRows);
    downloadStringAsFile(csv, filename + '.csv');
    setDialogOpen(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              {/* {`${kpi.kpi_name}${kpi.channel ? ` (${kpi.channel})` : ``}`} */}
              {`${kpi.kpi_name}`}
            </CardTitle>
            {kpi.description && (
              <CardDescription className="text-xs line-clamp-2">{kpi.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {percentageChange !== null && (
              <div className={`text-sm font-medium ${
                percentageChange > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : percentageChange < 0 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}>
                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
              </div>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export KPI Data</DialogTitle>
                  <DialogDescription>Download the snapshot data for this KPI as a CSV file.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <Input
                    value={filename}
                    onChange={e => setFilename(ChartService.generateSafeFilename(e.target.value))}
                    className="w-full"
                    placeholder="Filename"
                  />
                  <span className="text-muted-foreground select-none">.csv</span>
                </div>
                <DialogFooter>
                  <Button onClick={handleDownload} type="button">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} type="button">Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
              <CardContent className="pt-0">
          <ChartContainer config={KPI_TIMESERIES_CHART_CONFIG}>
            <AreaChart data={chartData} width={undefined} height={undefined}>
            <defs>
              <linearGradient id={`gradient-${kpi.kpi_id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.646 0.222 180)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.646 0.222 180)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => ChartService.formatYAxisTick(value, kpi.unit_of_measure)}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <ChartTooltipContent
                      active={active}
                      payload={payload}
                      labelFormatter={(value) => {
                        const data = payload[0]?.payload;
                        return data ? format(new Date(data.fullDate), 'MMM dd, yyyy') : value;
                      }}
                      formatter={(value) => ChartService.formatTooltipValue(
                        value as number, 
                        kpi.kpi_name, 
                        kpi.unit_of_measure
                      )}
                    />
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="oklch(0.646 0.222 180)"
              strokeWidth={2}
              fill={`url(#gradient-${kpi.kpi_id})`}
              fillOpacity={0.4}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 