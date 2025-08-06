"use client";
import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from 'next-intl';
import type { Closer } from "@isleno/types/kpis";

interface KpiTableProps {
  title: string;
  closers: Closer[];
  kpiOrder: string[];
  kpiObjectives: Record<string, number>;
  hiddenKpis: Set<string>;
  hiddenClosers: Set<number>;
}

export default function KpiTable({
  title,
  closers,
  kpiOrder,
  kpiObjectives,
  hiddenKpis,
  hiddenClosers,
}: KpiTableProps) {
  const t = useTranslations('kpis');
  
  return (
    <section className="my-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="sticky left-0 bg-muted px-3 py-2">{t('closer')}</th>
              {kpiOrder
                .filter((key) => !hiddenKpis.has(key))
                .map((key) => (
                  <th key={key} className="px-3 py-2 whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger>{key}</TooltipTrigger>
                      <TooltipContent>{`${t('objective')}: ${
                        kpiObjectives[key] ?? "—"
                      }`}</TooltipContent>
                    </Tooltip>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {closers
              .filter((c) => !hiddenClosers.has(c.id))
              .map((closer) => {
                // Identify first KPI where performance < 60%
                const visibleKeys = kpiOrder.filter((key) => !hiddenKpis.has(key));
                const firstDeficitKey = visibleKeys.find((key) => {
                  const kpi = closer.kpis.find((k) => k.key === key);
                  const obj = kpiObjectives[key] ?? 0;
                  const pct = obj ? ((kpi?.count ?? 0) * 100) / obj : 0;
                  return obj > 0 && pct < 60;
                });
                return (
                  <tr key={closer.id} className="odd:bg-muted/40">
                    <td className="sticky left-0 px-3 py-1 font-medium">
                      {closer.name}
                    </td>
                    {visibleKeys.map((key) => {
                      const kpi = closer.kpis.find((k) => k.key === key);
                      const obj = kpiObjectives[key] ?? 0;
                      const pct = obj
                        ? Math.round(((kpi?.count ?? 0) * 100) / obj)
                        : 0;
                      const isFirstDeficit = key === firstDeficitKey;
                      return (
                        <td
                          key={key}
                          className={clsx(
                            "px-3 py-1 text-center",
                            isFirstDeficit && "bg-red-100 text-red-600"
                          )}
                        >
                          <div>{kpi?.count ?? 0}</div>
                          <div className="text-xs text-muted-foreground">{pct}%</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}