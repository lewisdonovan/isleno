"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { DateTime } from 'luxon';
import { useTheme } from 'next-themes';
import { useGanttData } from '@/hooks/useGanttData';
import { DateRange } from '@/types/gantt';
import { useGanttLayout } from '@/hooks/useGanttLayout';
import { useGanttEventHandlers } from '@/hooks/useGanttEventHandlers';
import type { BusinessGanttTask } from '@/types/projects';
import { PHASE_COLORS } from '@/lib/constants/projectConstants';
import { SupportedLocale } from '@/types/calendar';
import { getGanttColors } from '@/lib/gantt/colors';
import { formatCurrency, formatDateRange } from '@/lib/gantt/formatters';
import { navigateDateRange, resetToCurrentPeriod, createYearRange, createMonthRange } from '@/lib/gantt/navigation';
import { GANTT_CONFIG } from '@/lib/gantt/config';
import TaskTooltip from '@/components/gantt/TaskTooltip';
import TaskListTable from '@/components/gantt/TaskListTable';
import TaskListHeader from '@/components/gantt/TaskListHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Calendar, Expand, Shrink, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ProjectGanttProps {
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange) => void;
  onProjectsDataChange?: (projects: any[]) => void;
}

export default function ProjectGantt({ 
  locale = 'en', 
  onLocaleChange,
  dateRange: externalDateRange,
  onDateRangeChange: externalOnDateRangeChange,
  onProjectsDataChange
}: ProjectGanttProps) {
  const { resolvedTheme } = useTheme();
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [mounted, setMounted] = useState(false);
  
  // Internal date range state (used when no external dateRange is provided)
  const [internalDateRange, setInternalDateRange] = useState(() => {
    const now = DateTime.now();
    return {
      start: now.minus({ months: 6 }).startOf('month'),
      end: now.plus({ months: 12 }).endOf('month')
    };
  });

  // Use external dateRange if provided, otherwise use internal state
  const dateRange = externalDateRange || internalDateRange;
  const setDateRange = (newDateRange: DateRange | ((prev: DateRange) => DateRange)) => {
    if (externalOnDateRangeChange) {
      // If using external control, compute the new value and call the external handler
      const computedDateRange = typeof newDateRange === 'function' 
        ? newDateRange(dateRange) 
        : newDateRange;
      externalOnDateRangeChange(computedDateRange);
    } else {
      // If using internal state, pass through to the internal setter
      setInternalDateRange(newDateRange);
    }
  };

  const { 
    tasks, 
    isLoading, 
    error, 
    projects,
    projectCollapseStates,
    toggleProjectCollapse, 
    toggleAllProjects 
  } = useGanttData(dateRange);

  // Custom hooks for extracted logic
  const { containerRef, calculateColumnWidth } = useGanttLayout(viewMode, dateRange);
  const {
    handleTaskChange,
    handleTaskDelete,
    handleProgressChange,
    handleDblClick,
    handleSelect,
    handleExpanderClick
  } = useGanttEventHandlers({ tasks: tasks as BusinessGanttTask[], toggleProjectCollapse });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);



  // Notify parent of projects data changes
  useEffect(() => {
    if (onProjectsDataChange && projects.length > 0) {
      onProjectsDataChange(projects);
    }
  }, [projects, onProjectsDataChange]);

  const isDark = mounted && resolvedTheme === 'dark';

  // Check if all projects are expanded (to determine button icon)
  const allProjectsExpanded = useMemo(() => {
    return projects.every(project => !projectCollapseStates[project.id]);
  }, [projects, projectCollapseStates]);

  // Navigation and formatting functions using utilities
  const goToPreviousRange = useCallback(() => {
    setDateRange(prev => navigateDateRange(prev, 'prev', viewMode));
  }, [viewMode, setDateRange]);

  const goToNextRange = useCallback(() => {
    setDateRange(prev => navigateDateRange(prev, 'next', viewMode));
  }, [viewMode, setDateRange]);

  const goToToday = useCallback(() => {
    setDateRange(resetToCurrentPeriod());
  }, [setDateRange]);

  // Convert BusinessGanttTask to Task format expected by the library
  const ganttTasks = useMemo<Task[]>(() => {
    return tasks.map(task => ({
      start: task.start,
      end: task.end,
      name: task.name,
      id: task.id,
      type: task.type,
      progress: task.progress,
      isDisabled: task.isDisabled,
      styles: task.styles,
      project: task.project,
      dependencies: task.dependencies,
      hideChildren: task.hideChildren,
      displayOrder: task.displayOrder,
    }));
  }, [tasks]);





  const colors = getGanttColors(isDark);





  // Currency formatter bound to current locale
  const localFormatCurrency = useCallback((amount: number, currency = 'EUR') => 
    formatCurrency(amount, currency, locale), [locale]);

  // Custom tooltip content using extracted component
  const TaskTooltipContent = useCallback((props: { task: Task; fontSize: string; fontFamily: string; }) => (
    <TaskTooltip 
      {...props}
      businessTasks={tasks}
      locale={locale}
      formatCurrency={localFormatCurrency}
    />
  ), [tasks, locale, localFormatCurrency]);

  // Custom TaskListTable component using extracted component
  const CustomTaskListTable = useCallback((props: {
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
  }) => (
    <TaskListTable
      {...props}
      isDark={isDark}
      onExpanderClick={handleExpanderClick}
    />
  ), [isDark, handleExpanderClick]);

  // Custom TaskListHeader component using extracted component
  const CustomTaskListHeader = useCallback((props: {
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
  }) => (
    <TaskListHeader
      {...props}
      isDark={isDark}
      locale={locale}
    />
  ), [isDark, locale]);

  // Handle view mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Toggle all project collapse states (expand/collapse all)
  const toggleAllProjectsHandler = () => {
    toggleAllProjects();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'es' ? 'Cronograma de Proyectos' : 'Project Timeline'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600">
                {locale === 'es' 
                  ? 'Error al cargar los datos del cronograma' 
                  : 'Error loading timeline data'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {typeof error === 'string' ? error : error.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {locale === 'es' ? 'Cronograma de Proyectos' : 'Project Timeline'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === 'es' 
                  ? 'Visualiza fases de proyectos y flujos de efectivo a lo largo del tiempo'
                  : 'Visualize project phases and cash flows over time'
                }
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-normal justify-start min-w-[140px]"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {formatDateRange(dateRange.start, dateRange.end, locale)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      {locale === 'es' ? 'Rango de fechas' : 'Date Range'}
                    </div>
                    
                    {/* Quick presets */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {locale === 'es' ? 'Preselecciones rápidas:' : 'Quick presets:'}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(createYearRange())}
                          className="h-7 text-xs"
                        >
                          {locale === 'es' ? 'Este año' : 'This Year'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(createMonthRange(6, 6))}
                          className="h-7 text-xs"
                        >
                          {locale === 'es' ? '12 meses' : '12 Months'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(createMonthRange(12, 12))}
                          className="h-7 text-xs"
                        >
                          {locale === 'es' ? '24 meses' : '24 Months'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToToday}
                          className="h-7 text-xs"
                        >
                          {locale === 'es' ? 'Hoy' : 'Today'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Project Expand/Collapse Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllProjectsHandler}
                title={allProjectsExpanded 
                  ? (locale === 'es' ? 'Colapsar todos los proyectos' : 'Collapse all projects')
                  : (locale === 'es' ? 'Expandir todos los proyectos' : 'Expand all projects')
                }
              >
                {allProjectsExpanded ? (
                  <Shrink className="h-3 w-3" />
                ) : (
                  <Expand className="h-3 w-3" />
                )}
              </Button>

              <div className="w-px h-4 bg-border mx-1" />
              
              {/* View Mode Buttons */}
              <div className="flex gap-1">
                {[
                  { mode: ViewMode.Month, label: locale === 'es' ? 'Mes' : 'Month' },
                  { mode: ViewMode.Week, label: locale === 'es' ? 'Semana' : 'Week' },
                  { mode: ViewMode.Day, label: locale === 'es' ? 'Día' : 'Day' },
                ].map(({ mode, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange(mode)}
                    className="text-xs h-7"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="w-px h-4 bg-border mx-1" />
              
              {/* Navigation */}
              <Button variant="outline" size="sm" onClick={goToPreviousRange} className="h-7 w-7 p-0">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextRange} className="h-7 w-7 p-0">
                <ChevronRight className="h-3 w-3" />
              </Button>

              {onLocaleChange && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLocaleChange(locale === 'en' ? 'es' : 'en')}
                    className="text-xs h-7"
                  >
                    {locale === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Phase legend */}
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(PHASE_COLORS).map(([phaseType, colors]) => (
              <Badge 
                key={phaseType}
                variant="secondary"
                className="text-xs px-2 py-0 h-5"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {locale === 'es' ? {
                  purchase: 'Compra',
                  construction: 'Construcción', 
                  sale: 'Venta',
                  rental: 'Alquiler'
                }[phaseType as keyof typeof PHASE_COLORS] : {
                  purchase: 'Purchase',
                  construction: 'Construction',
                  sale: 'Sale', 
                  rental: 'Rental'
                }[phaseType as keyof typeof PHASE_COLORS]}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`gantt-container w-full overflow-hidden ${isDark ? 'gantt-dark' : 'gantt-light'}`}>
            {ganttTasks.length > 0 ? (
              <div className="w-full">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={viewMode}
                  viewDate={dateRange.start.toJSDate()}
                  locale={locale as string}
                  listCellWidth={GANTT_CONFIG.TASK_LIST_WIDTH}
                  columnWidth={calculateColumnWidth()}
                  rowHeight={GANTT_CONFIG.ROW_HEIGHT}
                  barCornerRadius={GANTT_CONFIG.BAR_CORNER_RADIUS}
                  handleWidth={GANTT_CONFIG.HANDLE_WIDTH}
                  fontSize={GANTT_CONFIG.FONT_SIZE}
                  barFill={GANTT_CONFIG.BAR_FILL}
                  barProgressColor={colors.barProgressColor}
                  barProgressSelectedColor={colors.barProgressSelectedColor}
                  barBackgroundColor={colors.barBackgroundColor}
                  barBackgroundSelectedColor={colors.barBackgroundSelectedColor}
                  projectProgressColor={colors.projectProgressColor}
                  projectProgressSelectedColor={colors.projectProgressSelectedColor}
                  projectBackgroundColor={colors.projectBackgroundColor}
                  projectBackgroundSelectedColor={colors.projectBackgroundSelectedColor}
                  milestoneBackgroundColor={colors.milestoneBackgroundColor}
                  milestoneBackgroundSelectedColor={colors.milestoneBackgroundSelectedColor}
                  rtl={false}
                  headerHeight={GANTT_CONFIG.HEADER_HEIGHT}
                  ganttHeight={Math.max(GANTT_CONFIG.MIN_GANTT_HEIGHT, ganttTasks.length * GANTT_CONFIG.ROW_HEIGHT + 80)}
                  preStepsCount={1}
                  TooltipContent={TaskTooltipContent}
                  TaskListHeader={CustomTaskListHeader}
                  TaskListTable={CustomTaskListTable}
                  onDateChange={handleTaskChange}
                  onDelete={handleTaskDelete}
                  onProgressChange={handleProgressChange}
                  onDoubleClick={handleDblClick}
                  onSelect={handleSelect}
                  onExpanderClick={handleExpanderClick} 
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{locale === 'es' ? 'No hay tareas para mostrar' : 'No tasks to display'}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 