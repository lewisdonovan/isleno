import React, { useState, useCallback } from 'react';
import { projectsDataService } from '@/lib/services/projectsDataService';
import { ProjectData } from '@/types/projects';

interface UseProjectsDataReturn {
  projects: ProjectData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useProjectsData(): UseProjectsDataReturn {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (force: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const projectsData = await projectsDataService.parseProjectsData({ force });
      setProjects(projectsData);
      setLastUpdated(new Date());
      
      console.log('Projects data loaded successfully:', projectsData.length, 'projects');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects data';
      console.error('Error fetching projects data:', err);
      setError(errorMessage);
      
      // If authentication error, provide helpful message
      if (errorMessage.includes('Authentication required')) {
        setError('Please log in to Monday.com to view live project data. Redirecting to login...');
        // Could redirect to login here if needed
        // window.location.href = '/auth/login';
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Auto-fetch on mount
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    projects,
    isLoading,
    error,
    refetch,
    lastUpdated
  };
} 