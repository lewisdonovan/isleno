"use client";
import useSWR from "swr";
import { useMemo } from "react";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((json) => json.data);

import type { DashboardData } from "@isleno/types/kpis";

export function useKpiDashboard(start: string, end: string) {
  // Raw data type returned by the API
  interface RawDashboardData {
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

  const {
    data: rawData,
    error,
    isLoading,
    mutate,
  } = useSWR<RawDashboardData>(
    `/api/dashboard/raw?startDate=${start}&endDate=${end}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  // Transform raw API shape into DashboardData expected by UI
  const data = useMemo<DashboardData | undefined>(() => {
    if (!rawData) return undefined;
    // Extract KPI definitions from aggregated activities
    const kpiDefs = rawData.activities.map((act) => ({ id: act.id, key: act.name, title: act.name }));
    // Build per-person KPI counts from pointActivities
    type PersonData = { id: number; name: string; kpiCounts: Map<string, number> };
    const personsMap = new Map<number, PersonData>();
    // Seed all users to include zero-value rows
    if (Array.isArray((rawData as any).users)) {
      (rawData as any).users.forEach((u: any) => {
        const uid = parseInt(u.id, 10);
        personsMap.set(uid, { id: uid, name: u.name, kpiCounts: new Map() });
      });
    }
    rawData.pointActivities.forEach((pAct: any) => {
      // Extract person info
      const personCv = pAct.column_values.find(
        (cv: any) => cv.type === "people" || cv.id === "person"
      );
      if (!personCv) return;
      let personId: number;
      try {
        const parsed = JSON.parse(personCv.value);
        personId = parsed.personsAndTeams?.[0]?.id;
      } catch {
        personId = Number(personCv.value);
      }
      const personName: string = personCv.text || "";
      if (!personsMap.has(personId)) {
        personsMap.set(personId, { id: personId, name: personName, kpiCounts: new Map() });
      }
      const pd = personsMap.get(personId)!;
      // Extract associated KPI definition id
      const boardRelCv = pAct.column_values.find(
        (cv: any) => cv.type === "board_relation" || cv.id.startsWith("board_relation")
      );
      let kpiDefId: string | undefined;
      if (boardRelCv) {
        try {
          const rel = JSON.parse(boardRelCv.value);
          kpiDefId = String(rel.linkedPulseIds?.[0]?.linkedPulseId);
        } catch {
          /* ignore */
        }
      }
      if (!kpiDefId) return;
      // Count one occurrence of this activity (regardless of points)
      const prev = pd.kpiCounts.get(kpiDefId) || 0;
      pd.kpiCounts.set(kpiDefId, prev + 1);
    });
    // Build closers list from personsMap
    const closers = Array.from(personsMap.values()).map((pd) => ({
      id: pd.id,
      name: pd.name,
      kpis: kpiDefs.map((def) => ({
        id: def.id,
        key: def.key,
        title: def.title,
        count: pd.kpiCounts.get(def.id) || 0,
      })),
    }));
    // No objectives by default
    const kpiObjectives: Record<string, number> = {};
    return { closers, kpiObjectives };
  }, [rawData]);

  return { data, error, isLoading, mutate };
}