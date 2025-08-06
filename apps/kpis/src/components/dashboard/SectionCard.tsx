import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface SectionCardProps {
  title: string
  description: string
  path: string
  icon: LucideIcon
  badge?: string
  isEnabled?: boolean
}

export function SectionCard({
  title,
  description,
  path,
  icon: Icon,
  badge,
  isEnabled = true
}: SectionCardProps) {
  if (isEnabled) {
    return (
      <Link href={path}>
      <Card className={`h-full transition-all duration-200 ${
        isEnabled 
          ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' 
          : 'opacity-60 cursor-not-allowed'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {badge && (
                  <Badge variant="secondary" className="mt-1">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardContent>
             </Card>
      </Link>
    )
  } else {
    return (
      <Card className="h-full transition-all duration-200 opacity-60 cursor-not-allowed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {badge && (
                  <Badge variant="secondary" className="mt-1">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    )
  }
} 