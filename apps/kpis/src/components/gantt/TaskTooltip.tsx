"use client";

import { Task } from "gantt-task-react";
import { DateTime } from 'luxon';
import type { BusinessGanttTask } from '@/types/projects';
import { SupportedLocale } from '@/types/calendar';

interface TaskTooltipProps {
  task: Task;
  fontSize: string;
  fontFamily: string;
  businessTasks: BusinessGanttTask[];
  locale: SupportedLocale;
  formatCurrency: (amount: number, currency?: string) => string;
}

export default function TaskTooltip({ 
  task, 
  fontSize, 
  fontFamily, 
  businessTasks, 
  locale,
  formatCurrency 
}: TaskTooltipProps) {
  const businessTask = businessTasks.find((t: BusinessGanttTask) => t.id === task.id);
  
  if (!businessTask) return null;

  const { businessData } = businessTask;
  
  return (
    <div 
      className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-sm z-50"
      style={{ fontSize, fontFamily }}
    >
      <div className="font-semibold text-popover-foreground mb-2">
        {task.name}
      </div>
      
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">{locale === 'es' ? 'Zona:' : 'Zone:'}</span> {businessData.zone}
        </div>
        <div>
          <span className="font-medium">{locale === 'es' ? 'Tipo:' : 'Type:'}</span> {businessData.propertyType}
        </div>
        <div>
          <span className="font-medium">{locale === 'es' ? 'Presupuesto:' : 'Budget:'}</span> {formatCurrency(businessData.budget)}
        </div>
        <div>
          <span className="font-medium">{locale === 'es' ? 'Gastado:' : 'Spent:'}</span> {formatCurrency(businessData.spent)}
        </div>
        <div>
          <span className="font-medium">{locale === 'es' ? 'Progreso:' : 'Progress:'}</span> {task.progress}%
        </div>
        <div>
          <span className="font-medium">{locale === 'es' ? 'Duración:' : 'Duration:'}</span>{' '}
          {DateTime.fromJSDate(task.start).toFormat('MMM dd')} - {DateTime.fromJSDate(task.end).toFormat('MMM dd')}
        </div>
        {businessData.cashFlows.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="font-medium">{locale === 'es' ? 'Flujos de Efectivo:' : 'Cash Flows:'}</div>
            {businessData.cashFlows.slice(0, 3).map((cf, index) => (
              <div key={index} className="text-xs">
                {cf.amount > 0 ? '💰' : '💸'} {formatCurrency(Math.abs(cf.amount))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 