"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateUtils } from "@/lib/utils/dateUtils";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  className?: string;
}

import { DATE_RANGE_PRESETS } from '@/configs/dateRanges';

export default function DateRangePicker({ onDateRangeChange, className }: DateRangePickerProps) {
  const defaultRange = DateUtils.getDefaultDateRange();
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
    setEndDate(DateUtils.adjustEndDateIfNeeded(newStartDate, endDate));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    setStartDate(DateUtils.adjustStartDateIfNeeded(startDate, newEndDate));
  };

  const setPresetRange = (days: number) => {
    const range = DateUtils.getDateRangeFromDays(days);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Helper to check if a preset is active
  const isPresetActive = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return (
      startDate === DateUtils.formatDateForDB(start) && endDate === DateUtils.formatDateForDB(end)
    );
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
        <Input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="w-full sm:w-auto min-w-0"
        />
        <span className="text-sm text-muted-foreground text-center sm:text-left">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className="w-full sm:w-auto min-w-0"
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                    {DATE_RANGE_PRESETS.map((preset) => (
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