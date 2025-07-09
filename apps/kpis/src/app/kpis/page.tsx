"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KpiDashboardClient from "@/components/KpiDashboardClient";

export default function KpisPage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submittedStart, setSubmittedStart] = useState<string | null>(null);
  const [submittedEnd, setSubmittedEnd] = useState<string | null>(null);
  const handleFetch = () => {
    if (startDate && endDate) {
      setSubmittedStart(startDate);
      setSubmittedEnd(endDate);
    }
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end space-x-4">
        <div className="flex flex-col">
          <label className="text-sm mb-1" htmlFor="start-date">Fecha inicio</label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1" htmlFor="end-date">Fecha fin</label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button onClick={handleFetch}>Obtener KPIs</Button>
      </div>
      {submittedStart && submittedEnd ? (
        <KpiDashboardClient start={submittedStart} end={submittedEnd} />
      ) : (
        <div>Selecciona un rango de fechas y haz clic en "Obtener KPIs"</div>
      )}
    </div>
  );
}
