import { DateTime } from 'luxon';

export interface ProjectPhase {
  id: string;
  name: string;
  groupId: string;
  backgroundColor: string;
  textColor: string;
  estimatedDurationWeeks: number;
  dateFieldId: string;
  order: number;
}

export const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 'legal',
    name: 'Legal',
    groupId: 'topics',
    backgroundColor: 'rgb(87, 155, 252)',
    textColor: '#ffffff',
    estimatedDurationWeeks: 3,
    dateFieldId: 'date_mkt5pp4v',
    order: 1
  },
  {
    id: 'construction_preparation',
    name: 'Construction Preparation',
    groupId: 'new_group',
    backgroundColor: 'rgb(255, 203, 0)',
    textColor: '#000000',
    estimatedDurationWeeks: 3,
    dateFieldId: 'date_mkt5naw5',
    order: 2
  },
  {
    id: 'renovation',
    name: 'Renovation',
    groupId: 'group_title',
    backgroundColor: 'rgb(162, 93, 220)',
    textColor: '#ffffff',
    estimatedDurationWeeks: 6,
    dateFieldId: 'date_mkt5z4qf',
    order: 3
  },
  {
    id: 'staging',
    name: 'Staging',
    groupId: 'new_group83889',
    backgroundColor: 'rgb(226, 68, 92)',
    textColor: '#ffffff',
    estimatedDurationWeeks: 1,
    dateFieldId: 'date_mkt5y4pf',
    order: 4
  },
  {
    id: 'completed_our_stock',
    name: 'Completed / Our Stock',
    groupId: 'new_group17614',
    backgroundColor: 'rgb(3, 127, 76)',
    textColor: '#ffffff',
    estimatedDurationWeeks: 4.3, // 30 days ≈ 4.3 weeks
    dateFieldId: 'date_mkt5m6tt',
    order: 5
  },
  {
    id: 'completed_reserved_arras',
    name: 'Completed / Reserved Arras',
    groupId: 'new_group__1',
    backgroundColor: 'rgb(0, 200, 117)',
    textColor: '#000000',
    estimatedDurationWeeks: 3,
    dateFieldId: 'date_mkt5ky38',
    order: 6
  }
];

export const PHASE_BY_GROUP_ID: Record<string, ProjectPhase> = PROJECT_PHASES.reduce((acc, phase) => {
  acc[phase.groupId] = phase;
  return acc;
}, {} as Record<string, ProjectPhase>);

export const PHASE_BY_ID: Record<string, ProjectPhase> = PROJECT_PHASES.reduce((acc, phase) => {
  acc[phase.id] = phase;
  return acc;
}, {} as Record<string, ProjectPhase>);

export interface ProjectPhaseTimeline {
  phase: ProjectPhase;
  startDate: DateTime;
  endDate: DateTime;
  isCurrentPhase: boolean;
}

export function calculatePhaseTimeline(
  projectStartDate: DateTime,
  currentPhase: ProjectPhase,
  phaseDates: Record<string, DateTime | null>
): ProjectPhaseTimeline[] {
  const timeline: ProjectPhaseTimeline[] = [];

  // Calculate key milestone dates
  const legalStart = projectStartDate;
  const legalEnd = legalStart.plus({ weeks: 3 });
  const renovationStart = legalEnd; // Renovation starts when Legal ends
  const renovationEnd = renovationStart.plus({ weeks: 6 });
  const stagingStart = renovationEnd.minus({ weeks: 1 }); // Staging starts 1 week before Renovation ends
  const stagingEnd = renovationEnd;
  const completedOurStockStart = renovationEnd;
  const completedOurStockEnd = completedOurStockStart.plus({ weeks: 4.3 });
  const completedReservedArrasStart = completedOurStockEnd;
  const completedReservedArrasEnd = completedReservedArrasStart.plus({ weeks: 3 });

  // Handle phases with their specific timing relationships
  for (const phase of PROJECT_PHASES) {
    // Check if we have an actual date for this phase
    const actualDate = phaseDates[phase.dateFieldId];
    let phaseStartDate: DateTime;
    let phaseEndDate: DateTime;

    if (actualDate) {
      // Use actual date if available
      phaseStartDate = actualDate;
      phaseEndDate = actualDate.plus({ weeks: phase.estimatedDurationWeeks });
    } else {
      // Calculate fallback dates based on phase relationships
      switch (phase.id) {
        case 'legal':
          phaseStartDate = legalStart;
          phaseEndDate = legalEnd;
          break;
          
        case 'construction_preparation':
          // Construction starts in parallel with Legal (same start date)
          phaseStartDate = legalStart;
          phaseEndDate = legalStart.plus({ weeks: 3 });
          break;
          
        case 'renovation':
          phaseStartDate = renovationStart;
          phaseEndDate = renovationEnd;
          break;
          
        case 'staging':
          phaseStartDate = stagingStart;
          phaseEndDate = stagingEnd;
          break;
          
        case 'completed_our_stock':
          phaseStartDate = completedOurStockStart;
          phaseEndDate = completedOurStockEnd;
          break;
          
        case 'completed_reserved_arras':
          phaseStartDate = completedReservedArrasStart;
          phaseEndDate = completedReservedArrasEnd;
          break;
          
        default:
          // Fallback for any other phases
          phaseStartDate = projectStartDate;
          phaseEndDate = projectStartDate.plus({ weeks: phase.estimatedDurationWeeks });
          break;
      }
    }

    // Add phase to timeline
    timeline.push({
      phase,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      isCurrentPhase: phase.id === currentPhase.id
    });
  }

  return timeline;
} 