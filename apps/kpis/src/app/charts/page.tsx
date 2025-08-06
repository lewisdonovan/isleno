"use client"

import { ChartsDemo } from "@/components/ChartsDemo";
import { useTranslations } from 'next-intl';

export default function ChartsPage() {
  const t = useTranslations('pages.charts');
  
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        <ChartsDemo />
      </div>
    </div>
  );
} 