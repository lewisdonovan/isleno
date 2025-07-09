import { DateTime } from 'luxon';
import { Task } from 'gantt-task-react';
import { DateRange } from '@/types/gantt';
import { ProjectData, BusinessGanttTask, GanttProject, GanttMetrics, CashflowEvent } from '@/types/projects';
import { PHASE_COLOR_MAP } from '@/lib/constants/projectConstants';
import { projectsDataService } from './projectsDataService';

// Fetch projects for Gantt chart view
export async function fetchGanttProjects(dateRange: DateRange): Promise<GanttProject[]> {
  const projects = await projectsDataService.parseProjectsData();
  
  // Filter projects that overlap with the date range
  return projects
    .filter(p => {
      const projectStart = p.arrasSignedDate || DateTime.now().minus({ months: 1 });
      const projectEnd = p.projectFinishDate || projectStart.plus({ months: 6 });
      return projectStart <= dateRange.end && projectEnd >= dateRange.start;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      zone: p.zone,
      phase: p.phase,
      progress: p.progress,
      startDate: p.arrasSignedDate || DateTime.now().minus({ months: 1 }),
      endDate: p.projectFinishDate || DateTime.now().plus({ months: 6 }),
      financials: {
        totalCost: (p.arrasAmount || 0) + (p.outstandingAmount || 0),
        revenue: p.soldPrice || p.salePrice || 0,
        netValue: (p.soldPrice || p.salePrice || 0) - ((p.arrasAmount || 0) + (p.outstandingAmount || 0))
      }
    }));
}

// Fetch tasks for Gantt chart with business data
export async function fetchGanttTasks(
  dateRange: DateRange, 
  projectCollapseStates: Record<string, boolean> = {}
): Promise<BusinessGanttTask[]> {
  const projects = await projectsDataService.parseProjectsData();
  const tasks: BusinessGanttTask[] = [];
  
  // Filter projects within date range
  const filteredProjects = projects.filter(project => {
    const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
    const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
    return startDate <= dateRange.end && endDate >= dateRange.start;
  });
  
  // Group by zone
  const pmiProjects = filteredProjects.filter(p => p.zone === 'PMI');
  const mahProjects = filteredProjects.filter(p => p.zone === 'MAH');
  
  let displayOrder = 1;
  
  // PMI group
  if (pmiProjects.length > 0) {
    const groupId = 'pmi-group';
    const isCollapsed = projectCollapseStates[groupId] || false;
    
    tasks.push({
      id: groupId,
      name: 'PMI (Palma)',
      start: new Date(),
      end: new Date(),
      progress: 0,
      type: 'project',
      hideChildren: isCollapsed,
      displayOrder: displayOrder++,
      businessData: {
        projectId: groupId,
        projectName: 'PMI Zone',
        zone: 'PMI',
        propertyType: 'multi_unit',
        phase: 'Purchase',
        budget: pmiProjects.reduce((sum, p) => sum + (p.arrasAmount || 0) + (p.outstandingAmount || 0), 0),
        spent: 0,
        cashFlows: []
      }
    });
    
    if (!isCollapsed) {
      pmiProjects.forEach(project => {
        const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
        const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
        const totalCost = (project.arrasAmount || 0) + (project.outstandingAmount || 0);
        
        tasks.push({
          id: `pmi-${project.id}`,
          name: project.name,
          start: startDate.toJSDate(),
          end: endDate.toJSDate(),
          progress: project.progress,
          type: 'task',
          project: groupId,
          displayOrder: displayOrder++,
          styles: {
            backgroundColor: PHASE_COLOR_MAP[project.phase as keyof typeof PHASE_COLOR_MAP] || '#6b7280',
            backgroundSelectedColor: PHASE_COLOR_MAP[project.phase as keyof typeof PHASE_COLOR_MAP] || '#6b7280'
          },
          businessData: {
            projectId: project.id,
            projectName: project.name,
            zone: project.zone,
            propertyType: 'single_unit',
            phase: project.phase,
            budget: totalCost,
            spent: totalCost * (project.progress / 100),
            cashFlows: project.cashflowEvents
          }
        });
      });
    }
  }
  
  // MAH group
  if (mahProjects.length > 0) {
    const groupId = 'mah-group';
    const isCollapsed = projectCollapseStates[groupId] || false;
    
    tasks.push({
      id: groupId,
      name: 'MAH (Menorca)',
      start: new Date(),
      end: new Date(),
      progress: 0,
      type: 'project',
      hideChildren: isCollapsed,
      displayOrder: displayOrder++,
      businessData: {
        projectId: groupId,
        projectName: 'MAH Zone',
        zone: 'MAH',
        propertyType: 'multi_unit',
        phase: 'Purchase',
        budget: mahProjects.reduce((sum, p) => sum + (p.arrasAmount || 0) + (p.outstandingAmount || 0), 0),
        spent: 0,
        cashFlows: []
      }
    });
    
    if (!isCollapsed) {
      mahProjects.forEach(project => {
        const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
        const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
        const totalCost = (project.arrasAmount || 0) + (project.outstandingAmount || 0);
        
        tasks.push({
          id: `mah-${project.id}`,
          name: project.name,
          start: startDate.toJSDate(),
          end: endDate.toJSDate(),
          progress: project.progress,
          type: 'task',
          project: groupId,
          displayOrder: displayOrder++,
          styles: {
            backgroundColor: PHASE_COLOR_MAP[project.phase as keyof typeof PHASE_COLOR_MAP] || '#6b7280',
            backgroundSelectedColor: PHASE_COLOR_MAP[project.phase as keyof typeof PHASE_COLOR_MAP] || '#6b7280'
          },
          businessData: {
            projectId: project.id,
            projectName: project.name,
            zone: project.zone,
            propertyType: 'single_unit',
            phase: project.phase,
            budget: totalCost,
            spent: totalCost * (project.progress / 100),
            cashFlows: project.cashflowEvents
          }
        });
      });
    }
  }
  
  return tasks.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

// Fetch metrics for Gantt dashboard
export async function fetchGanttMetrics(dateRange: DateRange): Promise<GanttMetrics> {
  const projects = await projectsDataService.parseProjectsData();
  
  // Filter projects within date range
  const relevantProjects = projects.filter(project => {
    const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
    const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
    return startDate <= dateRange.end && endDate >= dateRange.start;
  });
  
  const activeProjects = relevantProjects.filter(p => 
    !['Completed / Sold', 'Completed / Our Stock'].includes(p.phase)
  );
  
  const completedProjects = relevantProjects.filter(p => 
    ['Completed / Sold', 'Completed / Our Stock'].includes(p.phase)
  );
  
  const totalRevenue = relevantProjects.reduce((sum, p) => 
    sum + (p.soldPrice || p.salePrice || 0), 0
  );
  
  const totalCosts = relevantProjects.reduce((sum, p) => 
    sum + (p.arrasAmount || 0) + (p.outstandingAmount || 0), 0
  );
  
  const activeBudget = activeProjects.reduce((sum, p) => 
    sum + (p.arrasAmount || 0) + (p.outstandingAmount || 0), 0
  );
  
  // Calculate average project duration
  const projectsWithDates = relevantProjects.filter(p => p.arrasSignedDate && p.projectFinishDate);
  const averageDuration = projectsWithDates.length > 0
    ? projectsWithDates.reduce((sum, p) => {
        const duration = p.projectFinishDate!.diff(p.arrasSignedDate!, 'days').days;
        return sum + duration;
      }, 0) / projectsWithDates.length / 30 // Convert to months
    : 6; // Default 6 months
  
  // Calculate capacity utilization (simplified)
  const purchaseProjects = activeProjects.filter(p => ['Not Started', 'Legal', 'Construction Preparation'].includes(p.phase));
  const constructionProjects = activeProjects.filter(p => p.phase === 'Renovation');
  const saleProjects = activeProjects.filter(p => p.phase === 'Completed / Our Stock');
  
  return {
    totalProjects: relevantProjects.length,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    totalRevenue,
    totalCosts,
    netValue: totalRevenue - totalCosts,
    totalActiveBudget: activeBudget,
    averageProjectDuration: averageDuration,
    capacityUtilization: {
      purchase: purchaseProjects.length / 4, // Assuming capacity of 4
      construction: constructionProjects.length / 4,
      sale: saleProjects.length / 4
    }
  };
}

// Get tasks for a specific date range (legacy function)
export async function getTasksForDateRange(
  startDate: DateTime,
  endDate: DateTime
): Promise<Task[]> {
  const dateRange: DateRange = { start: startDate, end: endDate };
  const businessTasks = await fetchGanttTasks(dateRange);
  
  // Convert BusinessGanttTask to Task (removing business data)
  return businessTasks.map(task => ({
    id: task.id,
    name: task.name,
    start: task.start,
    end: task.end,
    progress: task.progress,
    type: task.type,
    styles: task.styles,
    project: task.project,
    dependencies: task.dependencies,
    hideChildren: task.hideChildren,
    isDisabled: task.isDisabled,
    displayOrder: task.displayOrder
  }));
} 