"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  className?: string;
}

const PRESETS = [
  { label: "Last 90 days", days: 90 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 30 days", days: 30 },
];

export default function DateRangePicker({ onDateRangeChange, className }: DateRangePickerProps) {
  // Helper function to ensure dates are in YYYY-MM-DD format
  const formatDateForDB = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Calculate default date range (past 60 days to today)
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60); // 60 days ago
    return {
      startDate: formatDateForDB(startDate),
      endDate: formatDateForDB(endDate)
    };
  };

  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  // Call the callback when dates change
  useEffect(() => {
    onDateRangeChange(startDate, endDate);
  }, [startDate, endDate, onDateRangeChange]);

  // Set default dates on mount
  useEffect(() => {
    onDateRangeChange(defaultRange.startDate, defaultRange.endDate);
  }, [onDateRangeChange, defaultRange.startDate, defaultRange.endDate]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(formatDateForDB(start));
    setEndDate(formatDateForDB(end));
  };

  // Helper to check if a preset is active
  const isPresetActive = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return (
      startDate === formatDateForDB(start) && endDate === formatDateForDB(end)
    );
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 ${className}`}>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="w-36"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className="w-36"
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={isPresetActive(preset.days) ? "default" : "outline"}
            size="sm"
            onClick={() => setPresetRange(preset.days)}
            className="flex-shrink-0"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
} 