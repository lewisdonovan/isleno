"use client";

import { useState } from 'react';
import FinancialCalendar from '@/components/FinancialCalendar';
import QueryProvider from '@/components/providers/QueryProvider';
import { SupportedLocale } from '@/types/calendar';
import { useTranslations } from 'next-intl';

function CalendarPageContent() {
  const [locale, setLocale] = useState<SupportedLocale>('en');
  const t = useTranslations('calendar');

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        
        <FinancialCalendar 
          locale={locale} 
          onLocaleChange={setLocale} 
        />
        
        {/* Future metrics dashboard placeholder */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">
              {t('freeLiquidity')}
            </h3>
            <p className="text-2xl font-bold text-green-600">€452,000</p>
            <p className="text-sm text-muted-foreground">
              {t('estimatedForToday')}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">
              {t('phaseSlots')}
            </h3>
            <p className="text-sm">
              {t('purchase')}: <span className="font-semibold">2/3</span>
            </p>
            <p className="text-sm">
              {t('construction')}: <span className="font-semibold">3/3</span>
            </p>
            <p className="text-sm">
              {t('sale')}: <span className="font-semibold">1/3</span>
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">
              {t('costCoverage')}
            </h3>
            <p className="text-2xl font-bold text-blue-600">71%</p>
            <p className="text-sm text-muted-foreground">
              {t('fixedCostsCovered')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <QueryProvider>
      <CalendarPageContent />
    </QueryProvider>
  );
} 