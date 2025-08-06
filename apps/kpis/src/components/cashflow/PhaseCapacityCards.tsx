import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "lucide-react";
import { useTranslations } from 'next-intl';
import type { PhaseCapacity } from "@/lib/services/operationalService";

interface PhaseCapacityCardsProps {
  phaseCapacity: PhaseCapacity[];
}

function getPhaseColor(utilization: number): string {
  if (utilization >= 1.0) return "text-red-600";
  if (utilization >= 0.8) return "text-yellow-600";
  return "text-green-600";
}

export function PhaseCapacityCards({ phaseCapacity }: PhaseCapacityCardsProps) {
  const t = useTranslations('components.cashflow.dataSource');
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {phaseCapacity.map((phase) => (
        <Card key={phase.phase}>
          <CardHeader>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <CardTitle className="text-sm font-medium">{phase.phase} Phase</CardTitle>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Data Source</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('phaseCapacity')}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <CardDescription>
              Capacity utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{phase.occupied}/{phase.total}</span>
              <span className={`text-sm font-medium ${getPhaseColor(phase.utilization)}`}>
                {Math.round(phase.utilization * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  phase.utilization >= 1.0 ? 'bg-red-500' :
                  phase.utilization >= 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, phase.utilization * 100)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {phase.total - phase.occupied} slots available
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 