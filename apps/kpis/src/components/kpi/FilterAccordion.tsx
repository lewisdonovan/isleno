import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Filter, X, CalendarDays, Users } from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import { useTranslations } from 'next-intl';

interface FilterAccordionProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  availableChannels: string[];
  selectedChannels: string[];
  setSelectedChannels: (channels: string[]) => void;
}

export function FilterAccordion({
  onDateRangeChange,
  availableChannels,
  selectedChannels,
  setSelectedChannels
}: FilterAccordionProps) {
  const t = useTranslations('components.kpiCategory');

  return (
    <Accordion type="single" collapsible defaultValue="filters" className="w-full">
      <AccordionItem value="filters" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">{t('filters')}</span>
            {selectedChannels.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedChannels.length} {selectedChannels.length === 1 ? t('channel') : t('channels')}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 overflow-hidden">
          <div className="space-y-4 w-full">
            {/* Date Range */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                <CalendarDays className="h-4 w-4" />
                <span>{t('dateRange')}</span>
              </h4>
              <DateRangePicker onDateRangeChange={onDateRangeChange} className="!flex-col !space-y-2 !items-start" />
            </div>

            {/* Channel Filter */}
            {availableChannels.length > 0 && (
              <>
                <div className="border-t border-border pt-4" />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{t('channels')}</span>
                  </h4>
                  <div className="space-y-2">
                    {availableChannels.map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`channel-${channel}`}
                          checked={selectedChannels.includes(channel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannels([...selectedChannels, channel]);
                            } else {
                              setSelectedChannels(selectedChannels.filter(c => c !== channel));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`channel-${channel}`} className="text-sm">
                          {channel}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Clear All Filters */}
            {selectedChannels.length > 0 && (
              <>
                <div className="border-t border-border pt-4" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedChannels([])}
                  className="w-full"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('clearFilters')}
                </Button>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 