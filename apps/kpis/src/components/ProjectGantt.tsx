"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  GanttComponent, 
  ColumnsDirective, 
  ColumnDirective, 
  EditSettingsModel, 
  ToolbarItem, 
  SelectionSettingsModel,
  Inject,
  Sort,
  Filter,
  Reorder,
  Resize,
  Toolbar,
  Edit,
  Selection,
  ContextMenu,
  ColumnMenu,
  DayMarkers
} from '@syncfusion/ej2-react-gantt';
import { DateTime } from 'luxon';
import { useTheme } from 'next-themes';
import { useGanttData } from '@/hooks/useGanttData';
import { DateRange } from '@isleno/types/gantt';
import { PHASE_COLORS } from '@/lib/constants/projectConstants';
import { PROJECT_PHASES } from '@/lib/constants/projectPhases';
import { SupportedLocale } from '@isleno/types/calendar';
import { formatCurrency } from '@/lib/gantt/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GanttControls } from '@/components/gantt/GanttControls';

// Import Syncfusion CSS
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-gantt/styles/material.css';
import '@syncfusion/ej2-grids/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-layouts/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-notifications/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-richtexteditor/styles/material.css';
import '@syncfusion/ej2-treegrid/styles/material.css';

// Import custom phase styling
import '@/styles/gantt-phases.css';

interface ProjectGanttProps {
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange) => void;
  onProjectsDataChange?: (projects: any[]) => void;
}

export default function ProjectGantt({ 
  locale = 'en', 
  dateRange: externalDateRange,
  onDateRangeChange: externalOnDateRangeChange,
  onProjectsDataChange
}: ProjectGanttProps) {
  const { resolvedTheme } = useTheme();
  const t = useTranslations('gantt');
  
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
  const setDateRange = useCallback((newDateRange: DateRange | ((prev: DateRange) => DateRange)) => {
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
  }, [externalOnDateRangeChange, dateRange]);

  const { 
    tasks, 
    isLoading, 
    error, 
    projects,
    projectCollapseStates,
    toggleProjectCollapse, 
    toggleAllProjects 
  } = useGanttData(dateRange);



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

    // Convert BusinessGanttTask to Syncfusion Gantt format
  const ganttTasks = useMemo(() => {
    console.log('Converting tasks to Gantt format:', tasks.length, 'tasks');
    return tasks.map(task => {
      console.log('Task progress:', task.name, task.progress);
      const ganttTask = {
        TaskID: task.id || `task-${Math.random()}`, // Ensure TaskID is never undefined
        TaskName: task.name || 'Unnamed Task',
        StartDate: task.start,
        EndDate: task.end,
        Progress: task.progress || 0,
        ParentID: task.project || null,
        Duration: DateTime.fromJSDate(task.end).diff(DateTime.fromJSDate(task.start), 'days').days,
        Predecessor: task.dependencies?.join(',') || '',
        ResourceInfo: task.type || 'task',
        ExpandedState: task.expandedState || 'Expanded',
      };
      
      return ganttTask;
    });
  }, [tasks]);

  // Syncfusion Gantt configuration
  const taskFields = {
    id: 'TaskID',
    name: 'TaskName',
    startDate: 'StartDate',
    endDate: 'EndDate',
    duration: 'Duration',
    progress: 'Progress',
    parentID: 'ParentID',
    predecessor: 'Predecessor',
    resourceInfo: 'ResourceInfo',
    expandState: 'ExpandedState'
  };

  const editSettings: EditSettingsModel = {
    allowAdding: false,
    allowEditing: false,
    allowDeleting: false,
    allowTaskbarEditing: false,
    showDeleteConfirmDialog: false
  };

  const toolbar: ToolbarItem[] = [];

  const selectionSettings: SelectionSettingsModel = {
    type: 'Single',
    mode: 'Row'
  };

  // Event handlers
  const actionBegin = (args: any) => {
    if (args.requestType === 'save') {
      // Handle task save
      console.log('Task saved:', args.data);
    }
  };

  const actionComplete = (args: any) => {
    if (args.requestType === 'save') {
      // Handle save completion
      console.log('Save completed');
    }
  };

  const rowSelecting = (args: any) => {
    // Handle row selection
    console.log('Row selected:', args.data);
  };

  // Add current date marker using CSS
  useEffect(() => {
    const addCurrentDateMarker = () => {
      const today = new Date();
      const ganttElement = document.querySelector('.e-gantt');
      
      if (ganttElement) {
        // Remove any existing current date marker
        const existingMarker = ganttElement.querySelector('.current-date-marker');
        if (existingMarker) {
          existingMarker.remove();
        }
        
        // Create a new current date marker
        const marker = document.createElement('div');
        marker.className = 'current-date-marker';
        marker.style.cssText = `
          position: absolute;
          top: 0;
          bottom: 0;
          left: ${getCurrentDatePosition(today)}px;
          width: 2px;
          background-color: #ff4444;
          z-index: 1000;
          pointer-events: none;
        `;
        
        ganttElement.appendChild(marker);
      }
    };
    
    // Calculate the position of current date in the timeline
    const getCurrentDatePosition = (date: Date) => {
      // This is a simplified calculation - you might need to adjust based on your timeline
      const timelineElement = document.querySelector('.e-gantt-chart');
      if (timelineElement) {
        const rect = timelineElement.getBoundingClientRect();
        const totalWidth = rect.width;
        const startDate = new Date('2025-01-01'); // Adjust based on your timeline start
        const endDate = new Date('2026-12-31'); // Adjust based on your timeline end
        const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const currentDays = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        return (currentDays / totalDays) * totalWidth;
      }
      return 0;
    };
    
    // Add the marker after a short delay to ensure the Gantt is rendered
    setTimeout(addCurrentDateMarker, 1000);
    
    // Re-add marker on window resize
    window.addEventListener('resize', addCurrentDateMarker);
    
    return () => {
      window.removeEventListener('resize', addCurrentDateMarker);
    };
  }, []);

  const expanding = (args: any) => {
    // Handle expand/collapse events
    console.log('Expand event args:', args);
    if (args.data) {
      const taskId = args.data.TaskID;
      console.log('Expand/collapse event:', taskId, 'expanded:', args.expanded);
      
      // Update our internal state to track the change
      toggleProjectCollapse(taskId);
    }
  };



  // Handle view mode changes (simplified for Syncfusion)
  const handleViewModeChange = (mode: string) => {
    // Syncfusion handles view modes differently
    console.log('View mode changed to:', mode);
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
              {t('projectTimeline')}
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
          <CardHeader>
            <CardTitle>
              {t('projectTimeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 text-destructive">
              {t('errorLoadingData')}: {typeof error === 'string' ? error : error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {t('projectTimeline')}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {t('timelineDescription')}
              </p>
            </div>
            
            {/* Controls */}
            <GanttControls
              viewMode="Month"
              setViewMode={handleViewModeChange}
              dateRange={dateRange}
              setDateRange={setDateRange}
              locale={locale}
              toggleAllProjects={toggleAllProjectsHandler}
              hasCollapsedProjects={Object.values(projectCollapseStates).some(collapsed => collapsed)}
            />
          </div>
          
          {/* Phase legend */}
          <div className="flex flex-wrap gap-1 mt-2">
            {PROJECT_PHASES.map((phase) => (
              <Badge 
                key={phase.id}
                variant="secondary"
                className="text-xs px-2 py-0 h-5"
                style={{ backgroundColor: phase.backgroundColor, color: phase.textColor }}
              >
                {phase.name}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`gantt-container w-full overflow-hidden ${isDark ? 'gantt-dark' : 'gantt-light'}`}>
            {ganttTasks.length > 0 ? (
              <div className="w-full">
                <GanttComponent
                  dataSource={ganttTasks}
                  taskFields={taskFields}
                  height="450px"
                  allowSelection={false}
                  allowResizing={false}
                  allowReordering={false}
                  allowSorting={false}
                  allowFiltering={false}
                  allowRowDragAndDrop={false}
                  editSettings={editSettings}
                  toolbar={toolbar}
                  selectionSettings={selectionSettings}
                  actionBegin={actionBegin}
                  actionComplete={actionComplete}
                  rowSelecting={rowSelecting}

                  // expanding={expanding}
                  locale={locale === 'es' ? 'es-ES' : 'en-US'}
                  enableContextMenu={false}
                  showColumnMenu={false}
                  allowKeyboard={false}
                  enableVirtualization={false}
                  enableImmutableMode={false}
                  splitterSettings={{ columnIndex: 2 }}
                  timelineSettings={{
                    topTier: {
                      unit: 'Month',
                      format: 'MMM yyyy'
                    },
                    bottomTier: {
                      unit: 'Week',
                      format: "'W' W",
                      count: 1
                    }
                  }}
                  labelSettings={{
                    leftLabel: 'TaskName',
                    rightLabel: 'Progress'
                  }}
                  tooltipSettings={{
                    showTooltip: true,
                    taskbar: (args: any) => {
                      const taskId = args?.data?.TaskID || args?.TaskID;
                      const businessData = args?.data?.businessData || args?.businessData;
                      const weeklyFinancials = businessData?.weeklyFinancials;
                      
                      // Find current week's financial data
                      const currentDate = DateTime.now();
                      const currentWeekStart = currentDate.startOf('week');
                      const currentWeekFinancial = weeklyFinancials?.find((week: any) => 
                        DateTime.fromJSDate(week.weekStart).equals(currentWeekStart)
                      );
                      
                      if (currentWeekFinancial && currentWeekFinancial.lineItems.length > 0) {
                        const lineItemsHtml = currentWeekFinancial.lineItems.map((item: any) => 
                          `<div style="margin: 2px 0;">
                            <span style="color: ${item.type === 'inflow' ? '#10b981' : '#ef4444'}; font-weight: bold;">
                              ${item.type === 'inflow' ? '+' : '-'}${formatCurrency(item.amount)}
                            </span>
                            <span style="margin-left: 8px; font-size: 12px;">${item.description}</span>
                          </div>`
                        ).join('');
                        
                        return `
                          <div style="padding: 8px; max-width: 300px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">Week of ${currentWeekStart.toFormat('MMM dd, yyyy')}</div>
                            <div style="margin-bottom: 4px;">
                              <strong>Net Flow:</strong> 
                              <span style="color: ${currentWeekFinancial.netFlow >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                                ${currentWeekFinancial.netFlow >= 0 ? '+' : ''}${formatCurrency(currentWeekFinancial.netFlow)}
                              </span>
                            </div>
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 4px; margin-top: 4px;">
                              <div style="font-weight: bold; margin-bottom: 2px;">Line Items:</div>
                              ${lineItemsHtml}
                            </div>
                          </div>
                        `;
                      }
                      
                      // Default tooltip
                      return `
                        <div style="padding: 8px;">
                          <div style="font-weight: bold;">${args?.data?.TaskName || args?.TaskName}</div>
                          <div>Progress: ${args?.data?.Progress || args?.Progress || 0}%</div>
                        </div>
                      `;
                    }
                  }}

                  highlightWeekends={true}
                  eventMarkers={[{
                    day: new Date(),
                    label: 'Today',
                    cssClass: 'current-date-marker'
                  }]}
                  taskbarTemplate={(props: any) => {
                    // Extract phase info from the task ID
                    const taskId = props?.data?.TaskID || props?.TaskID;
                    let phaseId = null;
                    
                    // Extract phase ID from task ID (e.g., "project-123-phase-legal" -> "legal")
                    if (taskId && taskId.includes('-phase-')) {
                      phaseId = taskId.split('-phase-')[1];
                    }
                    
                    // Find the phase definition
                    const phase = PROJECT_PHASES.find(p => p.id === phaseId);
                    
                    // Try different ways to access progress
                    const progress = props?.data?.Progress || props?.Progress || 0;
                    
                    // Get business data for financial information
                    const businessData = props?.data?.businessData || props?.businessData;
                    const weeklyFinancials = businessData?.weeklyFinancials;
                    
                    // Calculate current week's financial data
                    const currentDate = DateTime.now();
                    const currentWeekStart = currentDate.startOf('week');
                    const currentWeekFinancial = weeklyFinancials?.find((week: any) => 
                      DateTime.fromJSDate(week.weekStart).equals(currentWeekStart)
                    );
                    
                    if (phase) {
                      // For phase tasks, show progress and financial data if available
                      const hasFinancialData = currentWeekFinancial && currentWeekFinancial.netFlow !== 0;
                      
                      return (
                        <div 
                          style={{
                            backgroundColor: phase.backgroundColor,
                            color: phase.textColor,
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px'
                          }}
                          title={hasFinancialData ? 
                            `Progress: ${progress}%\nNet Flow: ${formatCurrency(currentWeekFinancial.netFlow)}` : 
                            `Progress: ${progress}%`
                          }
                        >
                          <div>{progress}%</div>
                          {hasFinancialData && (
                            <div style={{ fontSize: '8px', marginTop: '1px' }}>
                              {currentWeekFinancial.netFlow > 0 ? '+' : ''}{formatCurrency(currentWeekFinancial.netFlow)}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // For project parent tasks, show aggregated financial data
                    const projectNetFlow = weeklyFinancials?.reduce((sum: number, week: any) => sum + week.netFlow, 0) || 0;
                    
                    return (
                      <div style={{ 
                        height: '100%', 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#6b7280',
                        color: '#ffffff',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px'
                      }}
                      title={`Progress: ${progress}%\nTotal Net Flow: ${formatCurrency(projectNetFlow)}`}
                      >
                        <div>{progress}%</div>
                        {projectNetFlow !== 0 && (
                          <div style={{ fontSize: '8px', marginTop: '1px' }}>
                            {projectNetFlow > 0 ? '+' : ''}{formatCurrency(projectNetFlow)}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  gridLines="Both"
                  rowHeight={40}
                >
                  <Inject services={[Sort, Filter, Reorder, Resize, Toolbar, Edit, Selection, ContextMenu, ColumnMenu, DayMarkers]} />
                  <ColumnsDirective>
                    <ColumnDirective field="TaskName" headerText={t('items')} width="200"></ColumnDirective>
                  </ColumnsDirective>
                </GanttComponent>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noTasksToDisplay')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 