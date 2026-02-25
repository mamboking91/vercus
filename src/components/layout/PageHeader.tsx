import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-5 md:mb-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{title}</h1>
          {description && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
