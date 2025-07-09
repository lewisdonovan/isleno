import { useCallback } from 'react';
import { Task } from "gantt-task-react";
import type { BusinessGanttTask } from '@/types/projects';

export interface UseGanttEventHandlersResult {
  handleTaskChange: (task: Task) => void;
  handleTaskDelete: (task: Task) => void;
  handleProgressChange: (task: Task) => void;
  handleDblClick: (task: Task) => void;
  handleSelect: (task: Task, isSelected: boolean) => void;
  handleExpanderClick: (task: Task) => void;
}

export interface UseGanttEventHandlersProps {
  tasks: BusinessGanttTask[];
  toggleProjectCollapse: (taskId: string) => void;
}

export const useGanttEventHandlers = ({ 
  tasks, 
  toggleProjectCollapse 
}: UseGanttEventHandlersProps): UseGanttEventHandlersResult => {
  
  // Handle task changes (placeholder for future interactivity)
  const handleTaskChange = useCallback((task: Task) => {
    console.log('Task changed:', task);
    // In a real app, you would update the task here
  }, []);

  const handleTaskDelete = useCallback((task: Task) => {
    console.log('Task deleted:', task);
    // In a real app, you would delete the task here
  }, []);

  const handleProgressChange = useCallback((task: Task) => {
    console.log('Progress changed:', task);
    // In a real app, you would update the progress here
  }, []);

  const handleDblClick = useCallback((task: Task) => {
    console.log('Task double-clicked:', task);
    // In a real app, you might open a detail modal here
  }, []);

  const handleSelect = useCallback((task: Task, isSelected: boolean) => {
    console.log('Task selected:', task, isSelected);
  }, []);

  // Handle individual project expand/collapse
  const handleProjectToggle = useCallback((taskId: string) => {
    // Only handle if it's a project type task
    const task = tasks.find(t => t.id === taskId);
    if (task && task.type === 'project') {
      toggleProjectCollapse(taskId);
    }
  }, [tasks, toggleProjectCollapse]);

  const handleExpanderClick = useCallback((task: Task) => {
    handleProjectToggle(task.id);
  }, [handleProjectToggle]);

  return {
    handleTaskChange,
    handleTaskDelete,
    handleProgressChange,
    handleDblClick,
    handleSelect,
    handleExpanderClick
  };
}; 