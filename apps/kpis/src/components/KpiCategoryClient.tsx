"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";
import KpiTimeSeriesChart from "@/components/KpiTimeSeriesChart";
import KpiWeeklyTable from "@/components/KpiWeeklyTable";
import type { Database } from "@isleno/types/db/public";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { arrayToCsv, downloadStringAsFile } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { KpiCategoryService } from '@/lib/services/kpiCategoryService';
import { FilterAccordion } from "@/components/kpi/FilterAccordion";
import { SummaryAccordion } from "@/components/kpi/SummaryAccordion";

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
  // const t = useTranslations('components.kpiCategory'); // Available for future i18n use
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
    return KpiCategoryService.getAvailableChannels(kpis);
  }, [kpis]);

  // Filter KPIs by selected channels
  const filteredKpis = useMemo(() => {
    return KpiCategoryService.filterKpisByChannels(kpis, selectedChannels);
  }, [kpis, selectedChannels]);

  // Calculate summary data for biggest movers
  const summaryData = useMemo(() => {
    return KpiCategoryService.calculateBiggestMovers(filteredKpis, snapshots, 3);
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

  // const handleExport = () => {
  //   const csvData = KpiCategoryService.prepareCsvData(kpis, snapshots);
  //   const csv = arrayToCsv(csvData);
  //   downloadStringAsFile(csv, `${exportFilename}.csv`);
  //   setExportDialogOpen(false);
  // };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {/* Filters and Movers Section */}
            <div className="space-y-4">
              <FilterAccordion
                onDateRangeChange={handleDateRangeChange}
                availableChannels={availableChannels}
                selectedChannels={selectedChannels}
                setSelectedChannels={setSelectedChannels}
              />
              
              <SummaryAccordion
                selectedChannels={selectedChannels}
                summaryData={summaryData}
              />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="lg:col-span-3">
          {/* Weekly Table - Restored from your version */}
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