import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { 
  fetchGanttProjects, 
  fetchGanttTasks, 
  fetchGanttMetrics
} from '@/lib/services/ganttService';
import { getDefaultDateRange } from '@/lib/gantt/services';
import { DateRange } from '@/types/gantt';
import { useProjectsData } from './useProjectsData';
import type { GanttProject, GanttMetrics, BusinessGanttTask } from '@/types/projects';

// Date range interface is imported from types

// Hook for fetching projects within a date range
export function useGanttProjects(dateRange?: DateRange, enabled: boolean = true) {
  const effectiveDateRange = dateRange || getDefaultDateRange();
  
  return useQuery<GanttProject[], Error>({
    queryKey: ['gantt-projects', effectiveDateRange.start.toISO(), effectiveDateRange.end.toISO()],
    queryFn: () => Promise.resolve(fetchGanttProjects(effectiveDateRange)),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching tasks in react-gantt-task format with collapse state management
export function useGanttTasks(dateRange?: DateRange, projectCollapseStates: Record<string, boolean> = {}, enabled: boolean = true) {
  const effectiveDateRange = dateRange || getDefaultDateRange();
  
  return useQuery<BusinessGanttTask[], Error>({
    queryKey: ['gantt-tasks', effectiveDateRange.start.toISO(), effectiveDateRange.end.toISO(), projectCollapseStates],
    queryFn: () => Promise.resolve(fetchGanttTasks(effectiveDateRange, projectCollapseStates)),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching business metrics within a date range
export function useGanttMetrics(dateRange?: DateRange, enabled: boolean = true) {
  const effectiveDateRange = dateRange || getDefaultDateRange();
  
  return useQuery<GanttMetrics, Error>({
    queryKey: ['gantt-metrics', effectiveDateRange.start.toISO(), effectiveDateRange.end.toISO()],
    queryFn: () => Promise.resolve(fetchGanttMetrics(effectiveDateRange)),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook for fetching projects, tasks and metrics with collapse state management
export function useGanttData(dateRange?: DateRange) {
  const effectiveDateRange = dateRange || getDefaultDateRange();
  
  // Initialize projects data from API
  const { isLoading: isLoadingData, error: dataError } = useProjectsData();
  
  // State for managing project collapse/expand
  const [projectCollapseStates, setProjectCollapseStates] = useState<Record<string, boolean>>({});

  // Only fetch Gantt data after projects data is loaded
  const projectsQuery = useGanttProjects(effectiveDateRange, !isLoadingData);
  const tasksQuery = useGanttTasks(effectiveDateRange, projectCollapseStates, !isLoadingData);
  const metricsQuery = useGanttMetrics(effectiveDateRange, !isLoadingData);

  // Toggle individual project collapse state
  const toggleProjectCollapse = useCallback((projectId: string) => {
    setProjectCollapseStates(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  }, []);

  // Collapse all projects
  const collapseAllProjects = useCallback(() => {
    if (projectsQuery.data) {
      const allCollapsed = projectsQuery.data.reduce((acc, project) => {
        acc[project.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setProjectCollapseStates(allCollapsed);
    }
  }, [projectsQuery.data]);

  // Expand all projects
  const expandAllProjects = useCallback(() => {
    setProjectCollapseStates({});
  }, []);

  // Toggle all projects (expand if any are collapsed, collapse if all are expanded)
  const toggleAllProjects = useCallback(() => {
    if (projectsQuery.data) {
      const allExpanded = projectsQuery.data.every(project => !projectCollapseStates[project.id]);
      if (allExpanded) {
        collapseAllProjects();
      } else {
        expandAllProjects();
      }
    }
  }, [projectsQuery.data, projectCollapseStates, collapseAllProjects, expandAllProjects]);

  return {
    projects: projectsQuery.data || [],
    tasks: tasksQuery.data || [],
    metrics: metricsQuery.data,
    isLoading: isLoadingData || projectsQuery.isLoading || tasksQuery.isLoading || metricsQuery.isLoading,
    error: dataError || projectsQuery.error || tasksQuery.error || metricsQuery.error,
    isSuccess: !isLoadingData && !dataError && projectsQuery.isSuccess && tasksQuery.isSuccess && metricsQuery.isSuccess,
    // Collapse state management
    projectCollapseStates,
    toggleProjectCollapse,
    collapseAllProjects,
    expandAllProjects,
    toggleAllProjects,
    // Date range info
    dateRange: effectiveDateRange,
  };
} 