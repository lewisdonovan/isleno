import { useState, useEffect, useCallback, useRef } from 'react';
import { DateRange } from '@isleno/types/gantt';
import { GANTT_CONFIG } from '@/lib/gantt/config';

interface UseGanttLayoutProps {
  viewMode: string;
  dateRange: DateRange;
}

interface UseGanttLayoutResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  calculateColumnWidth: () => number;
}

export const useGanttLayout = ({ viewMode, dateRange }: UseGanttLayoutProps): UseGanttLayoutResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate periods count based on view mode
  const periodsCount = viewMode === 'Month' ? 12 : 
                      viewMode === 'Week' ? 52 : 
                      365; // Day view

  // Update container width on resize
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [updateContainerWidth]);

  // Calculate column width based on view mode and container width
  const calculateColumnWidth = useCallback(() => {
    const availableWidth = containerWidth - parseInt(GANTT_CONFIG.TASK_LIST_WIDTH);
    const defaultWidth = viewMode === 'Month' ? 120 : viewMode === 'Week' ? 150 : 100;
    return Math.max(defaultWidth, availableWidth / periodsCount);
  }, [containerWidth, viewMode, periodsCount]);

  return {
    containerRef,
    calculateColumnWidth
  };
}; 