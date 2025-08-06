import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LucideIcon, Info } from "lucide-react";
import { useTranslations } from 'next-intl';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  textColor?: string;
  dataSourceKey?: string;
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  textColor = "",
  dataSourceKey
}: MetricCardProps) {
  const t = useTranslations('components.cashflow.dataSource');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {dataSourceKey && (
                <Info className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </HoverCardTrigger>
          {dataSourceKey && (
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Data Source</h4>
                <p className="text-sm text-muted-foreground">
                  {t(dataSourceKey as any)}
                </p>
              </div>
            </HoverCardContent>
          )}
        </HoverCard>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textColor}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
} 