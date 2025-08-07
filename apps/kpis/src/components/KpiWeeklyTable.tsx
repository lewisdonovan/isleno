"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Database } from "@isleno/types/db/public";

type Snapshot = Database["public"]["Tables"]["snapshots"]["Row"];
type Kpi = Database["public"]["Tables"]["kpis"]["Row"];

type ViewMode = "general" | "closer";
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

type CheckboxProps = {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange">;

const Checkbox = ({ checked, onCheckedChange, ...rest }: CheckboxProps) => (
    <input
        type="checkbox"
        checked={checked}
        onChange={e => onCheckedChange(e.target.checked)}
        {...rest}
    />
);

export default function KpiWeeklyTable({ initialKpis, kpiOrder, startDateISO, endDateISO }: Props) {
    const [view, setView] = useState<ViewMode>("general");
    const [order, setOrder] = useState<OrderMode>("recent");
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [closerFilter, setCloserFilter] = useState<Set<string>>(new Set());

    const orderList = kpiOrder ?? [];

    const sortKpis = (list: Kpi[]) =>
        [...list].sort((a, b) => {
            const ai = orderList.indexOf(a.kpi_key);
            const bi = orderList.indexOf(b.kpi_key);
            return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
        });

    const weeks = useMemo(() => {
        if (!startDateISO || !endDateISO) return 4;
        const oneDay = 86_400_000;
        const diffDays = (new Date(endDateISO).getTime() - new Date(startDateISO).getTime()) / oneDay;
        return Math.max(1, Math.ceil((diffDays + 1) / 7));
    }, [startDateISO, endDateISO]);

    const intervals = useMemo((): Interval[] => {
        const out: Interval[] = [];
        const today = new Date();
        const mondayOffset = (today.getDay() + 6) % 7;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - mondayOffset);
        currentMonday.setHours(0, 0, 0, 0);

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

    const loadSnapshots = useCallback(async () => {
        if (!initialKpis.length) {
            setSnapshots([]);
            return;
        }
        const ids = initialKpis.map(k => k.kpi_id).join(",");
        const earliest = intervals.reduce((m, i) => (i.startISO < m ? i.startISO : m), intervals[0].startISO);
        const latest = intervals.reduce((m, i) => (i.endISO > m ? i.endISO : m), intervals[0].endISO);
        const params = new URLSearchParams({
            kpiIds: ids,
            startDate: earliest,
            endDate: latest,
            frequency: "daily",
        });
        if (view === "closer") params.set("byCloser", "true");

        setLoading(true);
        try {
            const res = await fetch(`/api/kpis/snapshots?${params.toString()}`);
            const json = await res.json();
            const raw: Snapshot[] = json.error ? [] : json.data ?? [];

            const keyMap = new Map<string, Snapshot>();
            raw.forEach(s => {
                const closerId =
                    s.closer_monday_id ??
                    s.snapshot_attributes?.find(a => a.snapshot_attribute === "closer_monday_id")?.snapshot_attribute_value ??
                    "";
                const k = `${s.kpi_id}|${s.snapshot_date}|${closerId}`;
                const prev = keyMap.get(k);
                if (!prev || new Date(s.created_at) > new Date(prev.created_at)) keyMap.set(k, s);
            });

            setSnapshots(Array.from(keyMap.values()));
        } catch {
            setSnapshots([]);
        } finally {
            setLoading(false);
        }
    }, [initialKpis, intervals, view]);


    useEffect(() => {
        loadSnapshots();
    }, [loadSnapshots, order]);

    const getCloserId = (s: Snapshot) => {
        if (s.closer_monday_id) return s.closer_monday_id;
        const attr = s.snapshot_attributes?.find(a => a.snapshot_attribute === "closer_monday_id");
        return attr ? attr.snapshot_attribute_value : null;
    };

    const closers = useMemo(() => {
        const map = new Map<string, string>();
        snapshots.forEach(s => {
            const cid = getCloserId(s);
            if (cid) map.set(cid, s.closer_name ?? "N/A");
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [snapshots]);

    useEffect(() => {
        if (view === "closer" && closerFilter.size === 0 && closers.length)
            setCloserFilter(new Set(closers.map(c => c.id)));
    }, [view, closers, closerFilter.size]);

    const snapsByKpiCloser = useMemo(() => {
        const map = new Map<string, Map<string, Snapshot[]>>();
        snapshots.forEach(s => {
            const cid = getCloserId(s);
            if (!cid) return;
            const kmap = map.get(s.kpi_id) ?? new Map<string, Snapshot[]>();
            const arr = kmap.get(cid) ?? [];
            arr.push(s);
            kmap.set(cid, arr);
            map.set(s.kpi_id, kmap);
        });
        return map;
    }, [snapshots]);

    const sumInterval = (list: Snapshot[], int: Interval) => {
        const nums = list.filter(
            x => x.snapshot_date >= int.startISO && x.snapshot_date <= int.endISO && x.numeric_value !== null
        ).map(x => x.numeric_value as number);
        return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    };

    const generalRows = useMemo(() => sortKpis(initialKpis).map(k => ({
        key: k.kpi_id,
        label: k.kpi_name,
        values: intervals.map(int => sumInterval(snapshots.filter(s => s.kpi_id === k.kpi_id), int))
    })), [initialKpis, intervals, snapshots]);

    const rowsByCloser = useMemo(() => {
        const out = new Map<string, { key: string; label: string; values: (number | null)[] }[]>();
        const sorted = sortKpis(initialKpis);
        closers.forEach(c => {
            if (!closerFilter.has(c.id)) return;
            const rows = sorted.map(k => {
                const list = snapsByKpiCloser.get(k.kpi_id)?.get(c.id) ?? [];
                return {
                    key: k.kpi_id,
                    label: k.kpi_name,
                    values: intervals.map(int => sumInterval(list, int))
                };
            });
            out.set(c.id, rows);
        });
        return out;
    }, [closers, closerFilter, initialKpis, intervals, snapsByKpiCloser]);

    const displayIntervals = useMemo(() =>
        intervals.map((i, idx) => ({ ...i, label: `Week ${idx + 1}` })), [intervals]);

    const renderTable = (rows: { key: string; label: string; values: (number | null)[] }[], firstCol: string) => (
        <table className="w-full text-sm border-collapse">
            <thead>
            <tr>
                <th className="sticky left-0 z-10 bg-background px-4 py-2 text-left border-b">{firstCol}</th>
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
    );

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
                            <SelectItem value="closer">By Closer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={order} onValueChange={v => setOrder(v as OrderMode)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Week 1 is the Most Recent</SelectItem>
                            <SelectItem value="oldest">Week 1 is the Oldest</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="secondary" onClick={loadSnapshots} disabled={loading}>Refresh</Button>
                </div>
                {view === "closer" && (
                    <div className="flex flex-wrap gap-4">
                        {closers.map(c => (
                            <label key={c.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={closerFilter.has(c.id)}
                                    onCheckedChange={v => {
                                        const next = new Set(closerFilter);
                                        v ? next.add(c.id) : next.delete(c.id);
                                        setCloserFilter(next);
                                    }}
                                />
                                <span>{c.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="overflow-x-auto pb-6 w-full">
                {view === "general" && renderTable(generalRows, "KPI")}
                {view === "closer" &&
                    closers.filter(c => closerFilter.has(c.id)).map(c => (
                        <div key={c.id} className="mb-8">
                            <h3 className="mb-3 font-medium">{c.name}</h3>
                            {renderTable(rowsByCloser.get(c.id) ?? [], "KPI")}
                        </div>
                    ))
                }
            </CardContent>
        </Card>
    );
}
