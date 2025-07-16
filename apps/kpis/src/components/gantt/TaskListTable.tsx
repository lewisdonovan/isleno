"use client";

import { Task } from "gantt-task-react";

interface TaskListTableProps {
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: Task[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  isDark: boolean;
  onExpanderClick: (task: Task) => void;
}

export default function TaskListTable({ 
  rowHeight, 
  fontFamily, 
  fontSize, 
  tasks, 
  selectedTaskId, 
  setSelectedTask,
  isDark,
  onExpanderClick
}: TaskListTableProps) {
  return (
    <div 
      className="table-container"
      style={{ width: "200px" }}
    >
      {/* Task rows */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`table-row ${selectedTaskId === task.id ? 'selected' : ''}`}
          style={{
            height: `${rowHeight}px`,
            fontFamily,
            fontSize,
            borderBottom: '1px solid #e2e8f0',
            background: selectedTaskId === task.id 
              ? (isDark ? '#334155' : '#e2e8f0')
              : (isDark ? '#1e293b' : '#ffffff'),
            display: 'flex',
            alignItems: 'center',
            paddingLeft: task.type === 'project' ? '8px' : '24px',
            cursor: 'pointer',
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}
          onClick={() => setSelectedTask(task.id)}
        >
          {/* Expander for projects */}
          {task.type === 'project' && (
            <span 
              style={{ marginRight: '6px', fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                onExpanderClick(task);
              }}
            >
              {task.hideChildren ? '▶' : '▼'}
            </span>
          )}
          <span style={{ 
            fontWeight: task.type === 'project' ? '600' : '400',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.name}
          </span>
        </div>
      ))}
    </div>
  );
} 