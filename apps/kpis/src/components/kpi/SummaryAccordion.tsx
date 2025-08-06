import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from 'next-intl';
import type { Database } from "@isleno/types/db/public";

interface SummaryItem {
  kpi: Database['public']['Tables']['kpis']['Row'];
  percentageChange?: number;
}

interface SummaryAccordionProps {
  selectedChannels: string[];
  summaryData: SummaryItem[];
}

export function SummaryAccordion({ selectedChannels, summaryData }: SummaryAccordionProps) {
  const t = useTranslations('components.kpiCategory');

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="movers" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{t('biggestMovers')}</span>
            {selectedChannels.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedChannels.length} {selectedChannels.length === 1 ? t('channel') : t('channels')}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground mb-3">
              {t('biggestChanges')}
            </p>
            {summaryData.length > 0 ? (
              <div className="space-y-3">
                {summaryData.map((item) => (
                  <div key={item.kpi.kpi_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.kpi.kpi_name}
                      </div>
                      {item.kpi.channel && (
                        <div className="text-xs text-muted-foreground">
                          {item.kpi.channel}
                        </div>
                      )}
                    </div>
                                         <div className="flex items-center space-x-1 ml-2">
                       {(item.percentageChange || 0) > 0 ? (
                         <TrendingUp className="h-3 w-3 text-green-500" />
                       ) : (
                         <TrendingDown className="h-3 w-3 text-red-500" />
                       )}
                       <span className={`text-xs font-medium ${
                         (item.percentageChange || 0) > 0 ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {(item.percentageChange || 0) > 0 ? '+' : ''}{(item.percentageChange || 0).toFixed(1)}%
                       </span>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('noChangesAvailable')}
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 