"use client";

import { useState } from 'react';
import FinancialCalendar from '@/components/FinancialCalendar';
import QueryProvider from '@/components/providers/QueryProvider';
import { SupportedLocale } from '@/types/calendar';

function CalendarPageContent() {
  const [locale, setLocale] = useState<SupportedLocale>('en');

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'es' ? 'Calendario de Caja' : 'Cash Flow Calendar'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {locale === 'es' 
              ? 'Visualiza la posición financiera y capacidad operacional a lo largo del tiempo'
              : 'Track financial position and operational capacity over time'
            }
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
              {locale === 'es' ? 'Liquidez Libre' : 'Free Liquidity'}
            </h3>
            <p className="text-2xl font-bold text-green-600">€452,000</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'es' ? 'Estimado para hoy' : 'Estimated for today'}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">
              {locale === 'es' ? 'Slots de Fase' : 'Phase Slots'}
            </h3>
            <p className="text-sm">
              {locale === 'es' ? 'Compra' : 'Purchase'}: <span className="font-semibold">2/3</span>
            </p>
            <p className="text-sm">
              {locale === 'es' ? 'Construcción' : 'Construction'}: <span className="font-semibold">3/3</span>
            </p>
            <p className="text-sm">
              {locale === 'es' ? 'Venta' : 'Sale'}: <span className="font-semibold">1/3</span>
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">
              {locale === 'es' ? 'Cobertura de Costos' : 'Cost Coverage'}
            </h3>
            <p className="text-2xl font-bold text-blue-600">71%</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'es' ? 'Costos fijos cubiertos por ingresos de alquiler' : 'Fixed costs covered by rental income'}
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