"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BarChart3, TrendingUp, TrendingDown, Filter, X, CalendarDays, Users, Download } from "lucide-react";
import KpiTimeSeriesChart from "@/components/KpiTimeSeriesChart";
import DateRangePicker from "@/components/DateRangePicker";
import type { Database } from "@isleno/types/db/public";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { arrayToCsv, downloadStringAsFile } from "@/lib/utils";
import KpiWeeklyTable from "@/components/KpiWeeklyTable";

interface KpiCategoryClientProps {
  _initialDepartment: Database['public']['Tables']['departments']['Row'];
  _initialCategory: Database['public']['Tables']['kpi_categories']['Row'];
  initialKpis: Database['public']['Tables']['kpis']['Row'][];
  kpiOrder?: readonly string[];
}

export default function KpiCategoryClient({
  _initialDepartment,
  _initialCategory,
  initialKpis,
  kpiOrder
}: KpiCategoryClientProps) {
  const [kpis] = useState(initialKpis);
  const [snapshots, setSnapshots] = useState<Database['public']['Tables']['snapshots']['Row'][]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState(_initialCategory.category_name.replace(/[^a-zA-Z0-9_-]+/g, '_'));

  const loadSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const kpiIds = kpis.map(kpi => kpi.kpi_id);

      if (kpiIds.length === 0) return;

      const params = new URLSearchParams({
        kpiIds: kpiIds.join(','),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        frequency: 'daily',
      });

      const response = await fetch(`/api/kpis/snapshots?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        console.error("Error fetching snapshots:", result.error);
      } else {
        setSnapshots(result.data || []);
      }
    } catch (err) {
      console.error("Error loading snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [kpis, dateRange.startDate, dateRange.endDate]);

  // Load snapshots when date range changes or when component mounts with KPIs
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && kpis.length > 0) {
      loadSnapshots();
    }
  }, [dateRange.startDate, dateRange.endDate, kpis.length, loadSnapshots]);

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  }, []);

  // Get available channels from KPIs
  const availableChannels = useMemo(() => {
    const channels = new Set(kpis.map(kpi => kpi.channel).filter(Boolean));
    return Array.from(channels).sort();
  }, [kpis]);

  // Filter KPIs by selected channels
  const filteredKpis = useMemo(() => {
    let list =
      selectedChannels.length === 0
        ? kpis
        : kpis.filter(kpi => selectedChannels.includes(kpi.channel));

    if (kpiOrder && kpiOrder.length > 0) {
      list = [...list].sort((a, b) => {
        const ai = kpiOrder.indexOf(a.kpi_key);
        const bi = kpiOrder.indexOf(b.kpi_key);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
    }

    return list;
  }, [kpis, selectedChannels, kpiOrder]);

  // Calculate summary data for biggest movers
  const summaryData = useMemo(() => {
    return filteredKpis.map(kpi => {
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
        percentageChange,
        hasData: chartData.length > 0
      };
    })
      .filter(item => item.hasData && item.percentageChange !== null)
      .sort((a, b) => Math.abs(b.percentageChange!) - Math.abs(a.percentageChange!))
      .slice(0, 3); // Top 3 biggest movers
  }, [filteredKpis, snapshots]);

  // Prepare CSV data for all filtered KPIs
  const allCsvRows = filteredKpis.flatMap(kpi => {
    const kpiSnapshots = snapshots.filter(s => s.kpi_id === kpi.kpi_id);
    return kpiSnapshots.map(s => ({
      date: s.snapshot_date,
      value: s.numeric_value,
      kpi_id: s.kpi_id,
      kpi_name: kpi.kpi_name,
      channel: kpi.channel || '',
      unit: kpi.unit_of_measure || '',
    }));
  });

  const handleExportAll = () => {
    const csv = arrayToCsv(allCsvRows);
    downloadStringAsFile(csv, exportFilename + '.csv');
    setExportDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <Accordion type="multiple" defaultValue={["filters"]} className="space-y-4">
              {/* Filters Panel */}
              <AccordionItem value="filters" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Date Range */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>Date Range</span>
                      </h4>
                      <DateRangePicker onDateRangeChange={handleDateRangeChange} className="!flex-col !space-y-2 !items-start" />
                    </div>

                    {/* Channel Filter */}
                    {availableChannels.length > 0 && (
                      <>
                        <div className="border-t border-border pt-4" />
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Channels</span>
                          </h4>
                          <div className="space-y-2">
                            {availableChannels.map((channel) => (
                              <div key={channel} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`channel-${channel}`}
                                  checked={selectedChannels.includes(channel)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedChannels([...selectedChannels, channel]);
                                    } else {
                                      setSelectedChannels(selectedChannels.filter(c => c !== channel));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={`channel-${channel}`} className="text-sm">
                                  {channel}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Clear All Filters */}
                    {(selectedChannels.length > 0) && (
                      <>
                        <div className="border-t border-border pt-4" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChannels([])}
                          className="w-full"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear all filters
                        </Button>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Biggest Movers */}
              <AccordionItem value="movers" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Biggest Movers</span>
                    {selectedChannels.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedChannels.length} channel{selectedChannels.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Biggest changes this period
                    </p>
                    {summaryData.length > 0 ? (
                      <div className="space-y-3">
                        {summaryData.map((item) => (
                          <div key={item.kpi.kpi_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {item.kpi.kpi_name}
                              </div>
                              {item.kpi.channel && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.kpi.channel}
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center space-x-1 text-sm font-medium ml-2 ${item.percentageChange! > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                              }`}>
                              {item.percentageChange! > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span>
                                {item.percentageChange! > 0 ? '+' : ''}{item.percentageChange!.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No data available</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="lg:col-span-3">
          <KpiWeeklyTable
            initialKpis={filteredKpis}
            kpiOrder={kpiOrder}
            startDateISO={dateRange.startDate}
            endDateISO={dateRange.endDate}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>KPI Time Series Data</span>
                {loading && (
                  <div className="text-sm text-muted-foreground ml-2">
                    Loading...
                  </div>
                )}
              </CardTitle>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Recent performance data for KPIs in this category
                </CardDescription>
                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export All CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export All KPI Data</DialogTitle>
                      <DialogDescription>Download all snapshot data in the current view as a CSV file.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                      <Input
                        value={exportFilename}
                        onChange={e => setExportFilename(e.target.value.replace(/[^a-zA-Z0-9_-]+/g, '_'))}
                        className="w-full"
                        placeholder="Filename"
                      />
                      <span className="text-muted-foreground select-none">.csv</span>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleExportAll} type="button">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="ghost" onClick={() => setExportDialogOpen(false)} type="button">Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {filteredKpis.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-fr mt-6">
              {filteredKpis.map((kpi) => {
                const kpiSnapshots = snapshots.filter(s => s.kpi_id === kpi.kpi_id);
                return (
                  <KpiTimeSeriesChart
                    key={kpi.kpi_id}
                    kpi={kpi}
                    snapshots={kpiSnapshots}
                    loading={loading}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active KPIs found in this category.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 