import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Info, MessageCircleWarning } from 'lucide-react'

export const ChartsDemo = () => {
  return (
    <div>
      <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800/50 dark:bg-teal-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
            <Info className="h-5 w-5" />
            Demo: shadcn/ui charts implementation
          </CardTitle>
          <CardDescription className="text-teal-700 dark:text-teal-300">
            <p>This page demonstrates how to use shadcn/ui charts to display data. For more information, check the docs on the link below.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-teal-700 dark:text-teal-300">
          <div className="space-y-2 text-sm">
            <p>• <strong>
              <a href='https://ui.shadcn.com/charts/' target='_blank' className="hover:text-teal-600 dark:hover:text-teal-100 transition-colors">shadcn/ui charts</a>
            </strong></p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <MessageCircleWarning className="h-5 w-5" />
            Warning
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            <p>This is a placeholder for the actual charts. The data is not real and the charts are not connected to the actual data.</p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}