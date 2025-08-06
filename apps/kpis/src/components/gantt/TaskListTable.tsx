"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface TaskListTableProps {
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: any[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  isDark?: boolean;
  onExpanderClick?: (taskId: string) => void;
}

export default function TaskListTable({
  rowHeight,
  rowWidth,
  fontFamily,
  fontSize,
  locale,
  tasks,
  selectedTaskId,
  setSelectedTask,
  isDark = false,
  onExpanderClick
}: TaskListTableProps) {
  return (
    <div
      className="gantt-tasklist-table"
      style={{
        fontFamily,
        fontSize,
        width: rowWidth,
        height: rowHeight * tasks.length
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeader className="w-8"></TableHeader>
            <TableHeader>Task Name</TableHeader>
            <TableHeader>Start Date</TableHeader>
            <TableHeader>End Date</TableHeader>
            <TableHeader>Duration</TableHeader>
            <TableHeader>Progress</TableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.TaskID}
              className={selectedTaskId === task.TaskID ? 'bg-muted' : ''}
              onClick={() => setSelectedTask(task.TaskID)}
            >
              <TableCell className="w-8">
                {task.ParentID && onExpanderClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpanderClick(task.TaskID);
                    }}
                    className="h-4 w-4 p-0"
                  >
                    {task.hideChildren ? '+' : '-'}
                  </Button>
                )}
              </TableCell>
              <TableCell>{task.TaskName}</TableCell>
              <TableCell>{task.StartDate?.toLocaleDateString(locale)}</TableCell>
              <TableCell>{task.EndDate?.toLocaleDateString(locale)}</TableCell>
              <TableCell>{task.Duration} days</TableCell>
              <TableCell>{task.Progress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 