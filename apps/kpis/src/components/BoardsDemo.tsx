import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Info } from 'lucide-react'

export const BoardsDemo = () => {
  return (
    <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800/50 dark:bg-teal-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
          <Info className="h-5 w-5" />
          Demo: Monday.com API Integration
        </CardTitle>
        <CardDescription className="text-teal-700 dark:text-teal-300">
          <p>This page demonstrates how to query and display data from the Monday.com API using OAuth authentication. It was built using the tools below. Click on the links to learn more.</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="text-teal-700 dark:text-teal-300">
        <div className="space-y-2 text-sm">
          <p>• <strong>
            <a href='https://developer.monday.com/api-reference/docs/basics' target='_blank' className="hover:text-teal-600 dark:hover:text-teal-100 transition-colors">Monday API</a>
          </strong></p>
          <p>• <strong>
            <a href='https://nextjs.org/learn' target='_blank' className="hover:text-teal-600 dark:hover:text-teal-100 transition-colors">NextJS</a>
          </strong></p>
          <p>• <strong>
            <a href='https://www.typescriptlang.org/docs/' target='_blank' className="hover:text-teal-600 dark:hover:text-teal-100 transition-colors">TypeScript</a>
          </strong></p>
          <p>• <strong>
            <a href='https://ui.shadcn.com/' target='_blank' className="hover:text-teal-600 dark:hover:text-teal-100 transition-colors">shadcn/ui</a>
          </strong></p>
        </div>
      </CardContent>
    </Card>
  )
}