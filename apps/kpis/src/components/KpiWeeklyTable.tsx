"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Database } from "@isleno/types/db/public";

// Tipos ---------------------------------------------------------------------

type Snapshot = Database["public"]["Tables"]["snapshots"]["Row"];
type Kpi = Database["public"]["Tables"]["kpis"]["Row"]

type ViewMode = "general" | "closer" | "location";
type OrderMode = "recent" | "oldest";

interface Interval {
  label: string;
  startISO: string;
  endISO: string;
  range: string;
}

interface Props {
  initialKpis: Kpi[];
  kpiOrder?: readonly string[];
  startDateISO: string;
  endDateISO: string;
}

// Componente ----------------------------------------------------------------

export default function KpiWeeklyTable({ initialKpis, kpiOrder, startDateISO, endDateISO }: Props) {
  const [view, setView] = useState<ViewMode>("general");
  const [order, setOrder] = useState<OrderMode>("recent");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const weeks = useMemo(() => {
    if (!startDateISO || !endDateISO) return 4;            // fallback
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = (new Date(endDateISO).getTime() - new Date(startDateISO).getTime()) / oneDay;
    return Math.max(1, Math.ceil((diffDays + 1) / 7));     // siempre ≥1
  }, [startDateISO, endDateISO]);

  // ---------------------------------------------------------------- filtered
  const filtered = useMemo(() => {
    if (view === "closer") return initialKpis.filter(k => k.closer_id && k.closer_name);
    if (view === "location") return initialKpis.filter(k => k.location);
    return initialKpis;
  }, [view, initialKpis]);

  // ---------------------------------------------------------- buildIntervals
  const intervals = useMemo((): Interval[] => {
    const out: Interval[] = [];
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = (day + 6) % 7;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);

    // Último domingo completo
    const lastSunday = new Date(currentMonday);
    lastSunday.setDate(currentMonday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);

    let end = lastSunday;
    for (let i = 0; i < weeks; i++) {
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const startISO = toISO(start);
      const endISO = toISO(end);
      out.push({ label: `Week ${i + 1}`, startISO, endISO, range: `${startISO} a ${endISO}` });
      end = new Date(start);
      end.setDate(start.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    }
    return order === "oldest" ? out.reverse() : out;
  }, [weeks, order]);

  // ------------------------------------------------------------------ fetch
  const loadSnapshots = useCallback(async () => {
    if (!filtered.length) {
      setSnapshots([]);
      return;
    }
    const ids = filtered.map(k => k.kpi_id).join(",");
    const earliest = intervals.reduce((min, i) => i.startISO < min ? i.startISO : min, intervals[0].startISO);
    const latest = intervals.reduce((max, i) => i.endISO > max ? i.endISO : max, intervals[0].endISO);
    const params = new URLSearchParams({ kpiIds: ids, startDate: earliest, endDate: latest });
    setLoading(true);
    try {
      const res = await fetch(`/api/kpis/snapshots?${params.toString()}`);
      const json = await res.json();
      setSnapshots(json.error ? [] : json.data ?? []);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [filtered, intervals]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots, view, order]);

  const sortedFiltered = useMemo(() => {
    const orderList = kpiOrder ?? [];
    return [...filtered].sort((a, b) => {
      const ai = orderList.indexOf(a.kpi_key);
      const bi = orderList.indexOf(b.kpi_key);
      return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
    });
  }, [filtered, kpiOrder]);

  // --------------------------------------------------------------- rows data
  const rows = useMemo(() => {
    const snapsByKpi = new Map<number, Snapshot[]>();
    snapshots.forEach(s => {
      const arr = snapsByKpi.get(s.kpi_id) ?? [];
      arr.push(s);
      snapsByKpi.set(s.kpi_id, arr);
    });

    const pickLast = (list: Snapshot[], int: Interval) => list
      .filter(x => x.snapshot_date >= int.startISO && x.snapshot_date <= int.endISO)
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
      .pop()?.numeric_value ?? null;

    if (view === "general") {
      return sortedFiltered.map(k => ({
        key: k.kpi_id,
        label: k.kpi_name,
        values: intervals.map(int => pickLast(snapsByKpi.get(k.kpi_id) ?? [], int)),
      }));
    }

    /* if (view === "general") {
      return filtered.map(k => ({
        key: k.kpi_id,
        label: k.kpi_name,
        values: intervals.map(int => pickLast(snapsByKpi.get(k.kpi_id) ?? [], int))
      }));
    } */

    const groupMap = new Map<string, number[]>();
    if (view === "closer") filtered.forEach(k => groupMap.set(k.closer_name!, [...(groupMap.get(k.closer_name!) ?? []), k.kpi_id]));
    if (view === "location") filtered.forEach(k => groupMap.set(k.location!, [...(groupMap.get(k.location!) ?? []), k.kpi_id]));

    const out: { key: string; label: string; values: (number | null)[] }[] = [];
    groupMap.forEach((ids, label) => {
      const values = intervals.map(int => {
        let sum = 0; let valid = false;
        ids.forEach(id => {
          const v = pickLast(snapsByKpi.get(id) ?? [], int);
          if (v !== null) { sum += v; valid = true; }
        });
        return valid ? sum : null;
      });
      out.push({ key: label, label, values });
    });
    return out;
  }, [filtered, snapshots, intervals, view]);

  // Renombrar intervalos a Week 1..N después de posible reverse ----------
  const displayIntervals = useMemo(() => intervals.map((i, idx) => ({ ...i, label: `Week ${idx + 1}` })), [intervals]);

  return (
    <Card className="mb-6 w-full">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            Weekly Performance {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Select value={view} onValueChange={v => setView(v as ViewMode)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="closer">By Closer</SelectItem>
              <SelectItem value="location">By Location</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={v => setOrder(v as OrderMode)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Week 1 is the Most Recent</SelectItem>
              <SelectItem value="oldest">Week 1 is the Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={loadSnapshots} disabled={loading}>Refresh</Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto pb-6 w-full">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background px-4 py-2 text-left border-b">
                {view === "general" ? "KPI" : view === "closer" ? "Closer" : "Location"}
              </th>
              {displayIntervals.map(int => (
                <th key={int.range} className="px-4 py-2 text-right border-b whitespace-nowrap align-bottom">
                  <div>{int.label}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{int.range}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={displayIntervals.length + 1}>No data available</td></tr>
            ) : rows.map(r => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="sticky left-0 z-10 bg-background px-4 py-2 font-medium whitespace-nowrap">{r.label}</td>
                {r.values.map((v, idx) => <td key={idx} className="px-4 py-2 text-right">{v !== null ? v.toLocaleString() : "–"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
