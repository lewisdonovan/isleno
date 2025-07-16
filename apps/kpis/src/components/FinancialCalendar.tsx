"use client";

import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { DateTime } from 'luxon';
import { useMonthlyEvents } from '@/hooks/useCalendarData';
import { CalendarEvent, SupportedLocale } from '@/types/calendar';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';

// Date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
  'es-ES': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Event type styles
const EVENT_STYLES = {
  past_cost: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
    color: '#ffffff',
  },
  upcoming_cost: {
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
    color: '#ffffff',
  },
  past_income: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
    color: '#ffffff',
  },
  upcoming_income: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    color: '#ffffff',
  },
};

interface FinancialCalendarProps {
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
}

export default function FinancialCalendar({ 
  locale = 'en', 
  onLocaleChange 
}: FinancialCalendarProps) {
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  const { data: events = [], isLoading, error } = useMonthlyEvents(currentDate);

  // Format currency based on locale
  const formatCurrency = useCallback((amount: number, currency: string) => {
    const localeString = locale === 'es' ? 'es-ES' : 'en-US';
    return new Intl.NumberFormat(localeString, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [locale]);

  // Custom event component
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const eventStyle = EVENT_STYLES[event.type];
    
    return (
      <div 
        className="h-full flex flex-col justify-between p-1 rounded text-xs"
        style={eventStyle}
        title={`${event.title} - ${formatCurrency(event.amount, event.currency)}`}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs opacity-90">
          {formatCurrency(event.amount, event.currency)}
        </div>
      </div>
    );
  }, [formatCurrency]);

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: EVENT_STYLES[event.type],
    };
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((newDate: Date) => {
    const dateTime = DateTime.fromJSDate(newDate);
    if (dateTime.isValid) {
      setCurrentDate(dateTime);
    }
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Toolbar with locale toggle
  const CustomToolbar = useCallback(({ date, view, onNavigate, onView }: any) => {
    const currentDateTime = DateTime.fromJSDate(date);
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('PREV')}
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {currentDateTime.toFormat(view === 'month' ? 'MMMM yyyy' : 'MMM dd, yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('NEXT')}
          >
            →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('TODAY')}
          >
            {locale === 'es' ? 'Hoy' : 'Today'}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
                     <div className="flex gap-1">
             {(['month', 'week', 'day'] as View[]).map((viewType) => {
               const labels = {
                 es: { month: 'Mes', week: 'Semana', day: 'Día' },
                 en: { month: 'Month', week: 'Week', day: 'Day' }
               };
               return (
                 <Button
                   key={viewType}
                   variant={view === viewType ? "default" : "outline"}
                   size="sm"
                   onClick={() => onView(viewType)}
                 >
                   {labels[locale][viewType as keyof typeof labels.en]}
                 </Button>
               );
             })}
          </div>
          
          {onLocaleChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLocaleChange(locale === 'en' ? 'es' : 'en')}
            >
              {locale === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
            </Button>
          )}
        </div>
      </div>
    );
  }, [locale, onLocaleChange]);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'es' ? 'Calendario Financiero' : 'Financial Calendar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600">
              {locale === 'es' 
                ? 'Error al cargar los datos del calendario' 
                : 'Error loading calendar data'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              {locale === 'es' ? 'Calendario Financiero' : 'Financial Calendar'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'es' 
                ? 'Seguimiento de ingresos y gastos por proyecto'
                : 'Track income and expenses across projects'
              }
            </p>
          </div>
          
          {/* Event type legend */}
          <div className="flex flex-wrap gap-2">
            <Badge style={EVENT_STYLES.past_cost}>💸 {locale === 'es' ? 'Gastos' : 'Past Costs'}</Badge>
            <Badge style={EVENT_STYLES.upcoming_cost}>📉 {locale === 'es' ? 'Próximos Gastos' : 'Upcoming Costs'}</Badge>
            <Badge style={EVENT_STYLES.past_income}>💰 {locale === 'es' ? 'Ingresos' : 'Past Income'}</Badge>
            <Badge style={EVENT_STYLES.upcoming_income}>📈 {locale === 'es' ? 'Próximos Ingresos' : 'Upcoming Income'}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            view={currentView}
            date={currentDate.toJSDate()}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            culture={locale === 'es' ? 'es-ES' : 'en-US'}
            messages={locale === 'es' ? {
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango',
              showMore: (total: number) => `+ ${total} más`,
            } : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
} 