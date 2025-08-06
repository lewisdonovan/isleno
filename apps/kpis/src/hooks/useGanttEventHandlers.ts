import { useCallback } from 'react';
import type { BusinessGanttTask } from '@isleno/types/gantt';

interface UseGanttEventHandlersProps {
  tasks: BusinessGanttTask[];
  toggleProjectCollapse: (projectId: string) => void;
}

export const useGanttEventHandlers = ({ tasks, toggleProjectCollapse }: UseGanttEventHandlersProps) => {
  const handleTaskChange = useCallback((task: any) => {
    console.log('Task changed:', task);
  }, []);

  const handleTaskDelete = useCallback((task: any) => {
    console.log('Task deleted:', task);
  }, []);

  const handleProgressChange = useCallback((task: any) => {
    console.log('Progress changed:', task);
  }, []);

  const handleDblClick = useCallback((task: any) => {
    console.log('Task double clicked:', task);
  }, []);

  const handleSelect = useCallback((task: any) => {
    console.log('Task selected:', task);
  }, []);

  const handleExpanderClick = useCallback((task: any) => {
    if (task.type === 'project') {
      toggleProjectCollapse(task.id);
    }
  }, [toggleProjectCollapse]);

  return {
    handleTaskChange,
    handleTaskDelete,
    handleProgressChange,
    handleDblClick,
    handleSelect,
    handleExpanderClick
  };
}; 