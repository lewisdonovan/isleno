import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Info } from 'lucide-react'
import { DEMO_CARD_STYLES } from '@/configs/themes';

export const BoardsDemo = () => {
  return (
    <Card className={DEMO_CARD_STYLES.info.card}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${DEMO_CARD_STYLES.info.title}`}>
          <Info className="h-5 w-5" />
          Demo: Monday.com API Integration
        </CardTitle>
        <CardDescription className={DEMO_CARD_STYLES.info.content}>
          <p>This page demonstrates how to query and display data from the Monday.com API using OAuth authentication. It was built using the tools below. Click on the links to learn more.</p>
        </CardDescription>
      </CardHeader>
      <CardContent className={DEMO_CARD_STYLES.info.content}>
        <div className="space-y-2 text-sm">
          <p>• <strong>
            <a href='https://developer.monday.com/api-reference/docs/basics' target='_blank' className={DEMO_CARD_STYLES.info.link}>Monday API</a>
          </strong></p>
          <p>• <strong>
            <a href='https://nextjs.org/learn' target='_blank' className={DEMO_CARD_STYLES.info.link}>NextJS</a>
          </strong></p>
          <p>• <strong>
            <a href='https://www.typescriptlang.org/docs/' target='_blank' className={DEMO_CARD_STYLES.info.link}>TypeScript</a>
          </strong></p>
          <p>• <strong>
            <a href='https://ui.shadcn.com/' target='_blank' className={DEMO_CARD_STYLES.info.link}>shadcn/ui</a>
          </strong></p>
        </div>
      </CardContent>
    </Card>
  )
}