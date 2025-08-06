"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/DateRangePicker";
import KpiDashboardClient from "@/components/KpiDashboardClient";
import { useTranslations } from 'next-intl';

export default function KpisLivePage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submittedStart, setSubmittedStart] = useState<string | null>(null);
  const [submittedEnd, setSubmittedEnd] = useState<string | null>(null);
  const t = useTranslations('pages.kpisLive');

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSubmit = () => {
    if (startDate && endDate) {
      setSubmittedStart(startDate);
      setSubmittedEnd(endDate);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <Button onClick={handleSubmit} disabled={!startDate || !endDate}>
            Obtener KPIs
          </Button>
        </div>
      </div>
      {submittedStart && submittedEnd ? (
        <KpiDashboardClient start={submittedStart} end={submittedEnd} />
      ) : (
        <div>{t('selectDateRange')}</div>
      )}
    </div>
  );
} 