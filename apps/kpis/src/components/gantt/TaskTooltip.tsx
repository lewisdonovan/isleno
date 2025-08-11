"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateTime } from 'luxon';
import type { BusinessGanttTask } from '@isleno/types/gantt';
import { SupportedLocale } from '@isleno/types/calendar';

interface TaskTooltipProps {
  task: any;
  fontSize: string;
  fontFamily: string;
  businessTasks?: BusinessGanttTask[];
  locale?: SupportedLocale;
  formatCurrency?: (amount: number, currency?: string) => string;
}

export default function TaskTooltip({
  task,
  fontSize,
  fontFamily,
  businessTasks,
  locale = 'en',
  formatCurrency
}: TaskTooltipProps) {
  const businessTask = businessTasks?.find(t => t.id === task.TaskID);
  
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        fontSize,
        fontFamily,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {task.TaskName}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div>Start: {task.StartDate?.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}</div>
        <div>End: {task.EndDate?.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}</div>
        <div>Duration: {task.Duration} days</div>
        <div>Progress: {task.Progress}%</div>
        {businessTask?.businessData?.budget && formatCurrency && (
          <div>Budget: {formatCurrency(businessTask.businessData.budget)}</div>
        )}
        {businessTask?.businessData?.spent && formatCurrency && (
          <div>Spent: {formatCurrency(businessTask.businessData.spent)}</div>
        )}
      </div>
    </div>
  );
} 