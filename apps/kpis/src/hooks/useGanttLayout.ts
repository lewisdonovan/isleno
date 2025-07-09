import { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode } from "gantt-task-react";
import { DateRange } from '@/types/gantt';
import { GANTT_CONFIG, VIEW_MODE_CONFIG } from '@/lib/gantt/config';

export interface UseGanttLayoutResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerWidth: number;
  calculateColumnWidth: () => number;
}

export const useGanttLayout = (viewMode: ViewMode, dateRange: DateRange): UseGanttLayoutResult => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle container width measurement
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate dynamic column width to fill available space
  const calculateColumnWidth = useCallback(() => {
    const viewConfig = VIEW_MODE_CONFIG[viewMode as keyof typeof VIEW_MODE_CONFIG];
    const defaultWidth = viewConfig?.defaultWidth || 120;
    
    if (containerWidth === 0) return defaultWidth;
    
    // Calculate available timeline width (container width - task list width - margins/scrollbar)
    const availableWidth = containerWidth - parseInt(GANTT_CONFIG.TASK_LIST_WIDTH) - GANTT_CONFIG.MARGIN_WIDTH;
    
    if (availableWidth <= 0) return defaultWidth;
    
    // Estimate number of periods that would be visible
    const rangeDuration = dateRange.end.diff(dateRange.start, 'days').days;
    const periodsCount = viewMode === ViewMode.Day 
      ? Math.min(rangeDuration, viewConfig?.maxDayViewLimit || rangeDuration)
      : Math.ceil(rangeDuration / (viewConfig?.daysPerPeriod || 30));
    
    // Aim to show optimal number of periods in the visible area
    const targetPeriods = Math.min(
      Math.max(periodsCount, GANTT_CONFIG.TARGET_VISIBLE_PERIODS.MIN), 
      GANTT_CONFIG.TARGET_VISIBLE_PERIODS.MAX
    );
    const calculatedWidth = Math.floor(availableWidth / targetPeriods);
    
    // Ensure reasonable bounds
    const boundedWidth = Math.max(
      GANTT_CONFIG.MIN_COLUMN_WIDTH, 
      Math.min(calculatedWidth, GANTT_CONFIG.MAX_COLUMN_WIDTH)
    );
    
    // Use the larger of calculated width or default width for better UX
    return Math.max(boundedWidth, defaultWidth);
  }, [containerWidth, viewMode, dateRange]);

  return {
    containerRef,
    containerWidth,
    calculateColumnWidth
  };
}; 