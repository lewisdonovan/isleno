"use client";

import { useState, useMemo } from "react";
import { useKpiDashboard } from "@/hooks/useKpiDashboard";
import KpiTable from "@/components/KpiTable";
import KpiConfigDrawer from "@/components/KpiConfigDrawer";
import { useTranslations } from 'next-intl';

export default function KpiDashboardClient({ start, end }: { start: string; end: string }) {
  const { data, error, isLoading } = useKpiDashboard(start, end);
  const t = useTranslations('kpis');
  const tComponents = useTranslations('components.kpiDashboard');
  
  // State for KPI configuration
  const [kpiOrder, setKpiOrder] = useState<string[]>([]);
  const [kpiObjectives, setKpiObjectives] = useState<Record<string, number>>({});
  const [hiddenKpisGeneral, setHiddenKpisGeneral] = useState<Set<string>>(new Set());
  const [hiddenKpisCollab, setHiddenKpisCollab] = useState<Set<string>>(new Set());
  const [hiddenClosers, setHiddenClosers] = useState<Set<number>>(new Set());

  // Initialize state when data loads
  useMemo(() => {
    if (data && data.closers.length > 0) {
      const kpis = data.closers[0]?.kpis.map(k => k.key) || [];
      if (kpiOrder.length === 0) {
        setKpiOrder(kpis);
      }
    }
  }, [data, kpiOrder.length]);

  if (isLoading) {
    return <div>{t('loadingKpiData')}</div>;
  }

  if (error) {
    return <div>{t('errorLoadingKpiData', { message: error.message })}</div>;
  }

  if (!data) {
    return <div>{t('noKpiDataAvailable')}</div>;
  }

  return (
    <div className="space-y-4">
      <KpiTable
        title={tComponents('generalKpis')}
        closers={data.closers}
        kpiOrder={kpiOrder}
        kpiObjectives={kpiObjectives}
        hiddenKpis={hiddenKpisGeneral}
        hiddenClosers={hiddenClosers}
      />
      <KpiConfigDrawer
        kpiOrder={kpiOrder}
        setKpiOrder={setKpiOrder}
        objectives={kpiObjectives}
        setObjectives={setKpiObjectives}
        hiddenKpisGeneral={hiddenKpisGeneral}
        setHiddenKpisGeneral={setHiddenKpisGeneral}
        hiddenKpisCollab={hiddenKpisCollab}
        setHiddenKpisCollab={setHiddenKpisCollab}
        hiddenClosers={hiddenClosers}
        setHiddenClosers={setHiddenClosers}
        closers={data.closers.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}