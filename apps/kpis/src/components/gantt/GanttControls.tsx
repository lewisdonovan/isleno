import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight, Expand, Shrink } from "lucide-react";
import { useTranslations } from 'next-intl';
import { DateRange } from '@isleno/types/gantt';
import { SupportedLocale } from '@isleno/types/calendar';
import { formatDateRange } from '@/lib/gantt/formatters';
import { navigateDateRange, resetToCurrentPeriod } from '@/lib/gantt/navigation';
import { DateTime } from 'luxon';

interface GanttControlsProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange | ((prev: DateRange) => DateRange)) => void;
  locale: SupportedLocale;
  toggleAllProjects: () => void;
  hasCollapsedProjects: boolean;
}

export function GanttControls({
  viewMode,
  setViewMode,
  dateRange,
  setDateRange,
  locale,
  toggleAllProjects,
  hasCollapsedProjects
}: GanttControlsProps) {
  const t = useTranslations('gantt');

  // Navigation functions
  const goToPreviousRange = () => {
    setDateRange(prev => navigateDateRange(prev, 'prev', viewMode));
  };

  const goToNextRange = () => {
    setDateRange(prev => navigateDateRange(prev, 'next', viewMode));
  };

  const goToToday = () => {
    setDateRange(resetToCurrentPeriod(viewMode));
  };

  // Quick date range presets
  const goToYear = () => {
    const now = DateTime.now();
    setDateRange({
      start: now.startOf('year'),
      end: now.endOf('year')
    });
  };

  const goToQuarter = () => {
    const now = DateTime.now();
    const quarter = Math.floor(now.month / 3);
    setDateRange({
      start: now.set({ month: quarter * 3 + 1 }).startOf('month'),
      end: now.set({ month: (quarter + 1) * 3 }).endOf('month')
    });
  };

  const goToMonth = () => {
    const now = DateTime.now();
    setDateRange({
      start: now.startOf('month'),
      end: now.endOf('month')
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Navigation Controls */}
      <div className="flex items-center border rounded-md bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousRange}
          className="h-7 px-2 rounded-none rounded-l-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 border-x rounded-none"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              {formatDateRange(dateRange.start, dateRange.end, locale)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="grid gap-1">
              <Button variant="ghost" size="sm" onClick={goToToday} className="justify-start">
                {t('today')}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToMonth} className="justify-start">
                {t('thisMonth')}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToQuarter} className="justify-start">
                {t('thisQuarter')}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToYear} className="justify-start">
                {t('thisYear')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextRange}
          className="h-7 px-2 rounded-none rounded-r-md"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View Mode Controls */}
      <div className="flex border rounded-md bg-muted/20">
        {(['Month', 'Week', 'Day'] as string[]).map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="h-7 px-2 text-xs rounded-none first:rounded-l-md last:rounded-r-md"
          >
            {mode === 'Month' && t('month')}
            {mode === 'Week' && t('week')}
            {mode === 'Day' && t('day')}
          </Button>
        ))}
      </div>

      {/* Project Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAllProjects}
        className="h-7 px-2"
      >
        {hasCollapsedProjects ? (
          <Expand className="h-4 w-4" />
        ) : (
          <Shrink className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
} 