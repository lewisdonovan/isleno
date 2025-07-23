"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export default function Home() {
  const logoUrl = 'https://storage.googleapis.com/static.inmoweb.es/clients/2877/logo/logo.png'
  const t = useTranslations('home')

  return (
      <div className="container mx-auto max-w-2xl p-6 flex flex-col items-center space-y-6">
        <Image src={logoUrl} alt="Logo Isleño" width={200} height={100} className="h-auto mb-1" />
        <h1 className="text-3xl font-bold tracking-tight text-center mb-3">
          {t('welcome')}
        </h1>
        <p className="text-center text-muted-foreground mb-2 mt-0">
          {t('description')}
        </p>

        <hr className="w-full border-t border-muted mb-2" />
        <Link href="/forms/point-activities" >
          <Button size="lg">{t('registerPA')}</Button>
        </Link>

        <Link href="/kpis" >
          <Button size="lg">{t('kpisDashboard')}</Button>
        </Link>
      </div>
  )
}
