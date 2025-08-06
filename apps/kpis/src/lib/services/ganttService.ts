import { DateTime } from 'luxon';
import { DateRange, ProjectStatus, WeeklyFinancialData } from '@isleno/types/gantt';
import { GanttProject, GanttMetrics } from '@isleno/types/gantt';
import { PHASE_COLOR_MAP } from '@/lib/constants/projectConstants';
import { projectsDataService } from './projectsDataService';
import { PROJECT_PHASES, PHASE_BY_GROUP_ID } from '@/lib/constants/projectPhases';

// Calculate weekly financial data for a project
function calculateWeeklyFinancials(project: any, dateRange: DateRange): WeeklyFinancialData[] {
  const weeklyData: WeeklyFinancialData[] = [];
  
  // Start from the beginning of the date range
  let currentWeek = dateRange.start.startOf('week');
  const endWeek = dateRange.end.endOf('week');
  
  while (currentWeek <= endWeek) {
    const weekStart = currentWeek;
    const weekEnd = currentWeek.endOf('week');
    
    const weekData: WeeklyFinancialData = {
      weekStart,
      weekEnd,
      inflows: 0,
      outflows: 0,
      netFlow: 0,
      lineItems: []
    };
    
    // Check if this week falls within the renovation phase
    const renovationPhase = project.phaseTimeline?.find((phase: any) => phase.phase.id === 'renovation');
    if (renovationPhase && weekStart >= renovationPhase.startDate && weekEnd <= renovationPhase.endDate) {
      // Calculate weekly renovation cost
      const renovationCost = project.renovationCost || 0;
      const renovationWeeks = 6; // Fixed 6-week renovation period
      const weeklyRenovationCost = renovationCost / renovationWeeks;
      
      weekData.outflows += weeklyRenovationCost;
      weekData.lineItems.push({
        type: 'outflow',
        amount: weeklyRenovationCost,
        description: 'Renovation cost',
        category: 'renovation_cost'
      });
    }
    
    // Calculate net flow
    weekData.netFlow = weekData.inflows - weekData.outflows;
    
    weeklyData.push(weekData);
    currentWeek = currentWeek.plus({ weeks: 1 });
  }
  
  return weeklyData;
}

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
export async function fetchGanttTasks(dateRange: DateRange, projectCollapseStates: Record<string, boolean> = {}): Promise<any[]> {
  const projects = await projectsDataService.parseProjectsData({ useFiltered: true });
  const tasks: any[] = [];
  
  // Filter projects within date range
  const filteredProjects = projects.filter(project => {
    const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
    const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
    return startDate <= dateRange.end && endDate >= dateRange.start;
  });
  
  let displayOrder = 1;
  
  // Projects group - all projects from board 30 regardless of location
  if (filteredProjects.length > 0) {
    const projectsGroupId = 'projects-group';
    const projectsIsCollapsed = projectCollapseStates[projectsGroupId] || false;
    
    // Calculate overall date range for the projects group
    const now = DateTime.now();
    const groupStartDate = now.minus({ months: 1 });
    const groupEndDate = now.plus({ months: 6 });
    
    tasks.push({
      id: projectsGroupId,
      name: 'Projects',
      start: groupStartDate.toJSDate(),
      end: groupEndDate.toJSDate(),
      progress: 0,
      type: 'project',
      expandedState: 'Expanded', // Always start expanded to avoid issues
      displayOrder: displayOrder++,
      businessData: {
        projectId: projectsGroupId,
        projectName: 'Projects',
        zone: 'ALL',
        propertyType: 'multi_unit',
        phase: 'Purchase',
        budget: filteredProjects.reduce((sum, p) => sum + (p.arrasAmount || 0) + (p.outstandingAmount || 0), 0),
        spent: 0,
        cashFlows: []
      }
    });
    
    // Fixed costs group (placeholder for now)
    const fixedCostsGroupId = 'fixed-costs-group';
    const fixedCostsIsCollapsed = projectCollapseStates[fixedCostsGroupId] || false;
    
    tasks.push({
      id: fixedCostsGroupId,
      name: 'Fixed costs',
      start: groupStartDate.toJSDate(),
      end: groupEndDate.toJSDate(),
      progress: 0,
      type: 'project',
      expandedState: fixedCostsIsCollapsed ? 'Collapsed' : 'Expanded',
      displayOrder: displayOrder++,
      businessData: {
        projectId: fixedCostsGroupId,
        projectName: 'Fixed costs',
        zone: 'ALL',
        propertyType: 'multi_unit',
        phase: 'Fixed',
        budget: 0,
        spent: 0,
        cashFlows: []
      }
    });
    
    // Process all projects
    filteredProjects.forEach(project => {
      const totalCost = (project.arrasAmount || 0) + (project.outstandingAmount || 0);
      
      // Create project parent task
      const projectTaskId = `project-${project.id}`;
      const projectIsCollapsed = projectCollapseStates[projectTaskId] || false;
      
      // Calculate project date range
      const projectStartDate = project.arrasSignedDate || now.minus({ months: 1 });
      const projectEndDate = project.projectFinishDate || now.plus({ months: 6 });
      
      // Calculate weekly financial data for this project
      const weeklyFinancials = calculateWeeklyFinancials(project, dateRange);
      
      tasks.push({
        id: projectTaskId,
        name: project.name,
        start: projectStartDate.toJSDate(),
        end: projectEndDate.toJSDate(),
        progress: project.progress || 0,
        type: 'project',
        project: projectsGroupId,
        expandedState: 'Expanded', // Always start expanded to avoid issues
        displayOrder: displayOrder++,
        businessData: {
          projectId: project.id,
          projectName: project.name,
          zone: project.zone,
          propertyType: 'single_unit',
          phase: null,
          budget: totalCost,
          spent: totalCost * (project.progress / 100),
          cashFlows: project.cashflowEvents,
          phaseId: null,
          isCurrentPhase: false,
          weeklyFinancials
        }
      });
      
                // Create phase child tasks for all projects
          if (project.phaseTimeline && project.phaseTimeline.length > 0) {
            project.phaseTimeline.forEach((phaseTimeline, index) => {
              const phase = phaseTimeline.phase;
              
              // Determine predecessor - previous phase in the timeline
              let predecessor = '';
              if (index > 0 && project.phaseTimeline) {
                const previousPhase = project.phaseTimeline[index - 1].phase;
                predecessor = `project-${project.id}-phase-${previousPhase.id}`;
              }
          
          // Calculate progress based on current date vs phase timeline
          const now = DateTime.now();
          let progress = 0;
          
          if (now < phaseTimeline.startDate) {
            // Future phase - 0% progress
            progress = 0;
          } else if (now > phaseTimeline.endDate) {
            // Past phase - 100% progress
            progress = 100;
          } else {
            // Current phase - calculate proportional progress
            const totalDuration = phaseTimeline.endDate.diff(phaseTimeline.startDate, 'days').days;
            const elapsedDuration = now.diff(phaseTimeline.startDate, 'days').days;
            progress = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
          }
          
                      tasks.push({
              id: `project-${project.id}-phase-${phase.id}`,
              name: phase.name,
              start: phaseTimeline.startDate.toJSDate(),
              end: phaseTimeline.endDate.toJSDate(),
              progress: progress,
              type: 'task',
              project: projectTaskId,
              predecessor: predecessor,
              displayOrder: displayOrder++,
              cssClass: `phase-${phase.id}`,
              styles: {
                backgroundColor: phase.backgroundColor,
                backgroundSelectedColor: phase.backgroundColor,
                color: phase.textColor
              },
              businessData: {
                projectId: project.id,
                projectName: project.name,
                zone: project.zone,
                propertyType: 'single_unit',
                phase: phase.name,
                budget: totalCost,
                spent: totalCost * (project.progress / 100),
                cashFlows: project.cashflowEvents,
                phaseId: phase.id,
                isCurrentPhase: phaseTimeline.isCurrentPhase
              }
            });
        });
      } else {
        // Fallback: create a single task if no phase timeline is available
        const startDate = project.arrasSignedDate || DateTime.now().minus({ months: 1 });
        const endDate = project.projectFinishDate || startDate.plus({ months: 6 });
        
        tasks.push({
          id: `project-${project.id}-fallback`,
          name: project.phase || 'Unknown Phase',
          start: startDate.toJSDate(),
          end: endDate.toJSDate(),
          progress: project.progress,
          type: 'task',
          project: projectTaskId,
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
            cashFlows: project.cashflowEvents,
            phaseId: null,
            isCurrentPhase: true
          }
        });
      }
    });
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
    date: DateTime.now(),
    phaseCapacities: [
      {
        type: 'purchase' as const,
        current: purchaseProjects.length,
        maximum: 4,
        projects: purchaseProjects.map(p => p.id)
      },
      {
        type: 'construction' as const,
        current: constructionProjects.length, 
        maximum: 4,
        projects: constructionProjects.map(p => p.id)
      },
      {
        type: 'sale' as const,
        current: saleProjects.length,
        maximum: 4, 
        projects: saleProjects.map(p => p.id)
      }
    ],
    totalActiveBudget: activeBudget,
    projectedCashFlow: {
      thisMonth: totalRevenue * 0.1, // Simplified projection
      nextMonth: totalRevenue * 0.15,
      nextQuarter: totalRevenue * 0.3
    },
    completedProjects: completedProjects.length,
    averageProjectDuration: averageDuration
  };
}

// Get tasks for a specific date range (legacy function)
export async function getTasksForDateRange(
  startDate: DateTime,
  endDate: DateTime
): Promise<any[]> {
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
    project: task.project,
    displayOrder: task.displayOrder
  }));
} 