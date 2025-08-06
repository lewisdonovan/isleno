import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Info, MessageCircleWarning } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DEMO_CARD_STYLES } from '@/configs/themes';

export const ChartsDemo = () => {
  const t = useTranslations('components.chartsDemo');
  
  return (
    <div>
      <Card className={DEMO_CARD_STYLES.info.card}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${DEMO_CARD_STYLES.info.title}`}>
            <Info className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription className={DEMO_CARD_STYLES.info.content}>
            <p>{t('description')}</p>
          </CardDescription>
        </CardHeader>
        <CardContent className={DEMO_CARD_STYLES.info.content}>
          <div className="space-y-2 text-sm">
            <p>• <strong>
              <a href='https://ui.shadcn.com/charts/' target='_blank' className={DEMO_CARD_STYLES.info.link}>shadcn/ui charts</a>
            </strong></p>
          </div>
        </CardContent>
      </Card>

      <Card className={`${DEMO_CARD_STYLES.warning.card} mt-6`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${DEMO_CARD_STYLES.warning.title}`}>
            <MessageCircleWarning className="h-5 w-5" />
            {t('warningTitle')}
          </CardTitle>
          <CardDescription className={DEMO_CARD_STYLES.warning.content}>
            <p>{t('warningDescription')}</p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}