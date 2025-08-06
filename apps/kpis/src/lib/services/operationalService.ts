import { DateTime } from 'luxon';
import { ProjectData, PROJECT_STAGES, PHASE_MAPPING } from '@isleno/types/projects';
import { PHASE_CAPACITIES } from '@/lib/constants/projectConstants';
import { projectsDataService } from './projectsDataService';

// Phase capacity interface
export interface PhaseCapacity {
  phase: string;
  occupied: number;
  total: number;
  utilization: number;
}

// Calculate capacity utilization by phase
export async function calculatePhaseCapacity(targetDate: DateTime = DateTime.now()): Promise<PhaseCapacity[]> {
  const projects = await projectsDataService.parseProjectsData();
  const phases = ['Purchase', 'Construction', 'Sale/Rental'];
  
  return phases.map(phase => {
    const occupied = projects.filter(p => {
      const statusIndex = Object.keys(PROJECT_STAGES).find(key => 
        PROJECT_STAGES[parseInt(key) as keyof typeof PROJECT_STAGES] === p.phase
      );
      const mappedPhase = statusIndex ? PHASE_MAPPING[parseInt(statusIndex) as keyof typeof PHASE_MAPPING] : undefined;
      return mappedPhase === phase && 
             (!p.projectFinishDate || p.projectFinishDate > targetDate);
    }).length;
    
    return {
      phase,
      occupied,
      total: PHASE_CAPACITIES[phase as keyof typeof PHASE_CAPACITIES],
      utilization: occupied / PHASE_CAPACITIES[phase as keyof typeof PHASE_CAPACITIES]
    };
  });
}

// Get projects by phase for analysis
export async function getProjectsByPhase(): Promise<Record<string, ProjectData[]>> {
  const projects = await projectsDataService.parseProjectsData();
  
  return projects.reduce((acc, project) => {
    const phase = project.phase;
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(project);
    return acc;
  }, {} as Record<string, ProjectData[]>);
}

// Get projects by zone (PMI/MAH)
export async function getProjectsByZone(): Promise<Record<'PMI' | 'MAH', ProjectData[]>> {
  const projects = await projectsDataService.parseProjectsData();
  
  return {
    PMI: projects.filter(p => p.zone === 'PMI'),
    MAH: projects.filter(p => p.zone === 'MAH')
  };
} 