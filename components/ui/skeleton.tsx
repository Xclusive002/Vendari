import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden="true" {...props} />
  )
}

function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <main className="dashboard-page md:pl-8" aria-label="Loading content">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3"><Skeleton className="h-9 w-48" /><Skeleton className="h-4 w-80 max-w-full" /></div>
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}</div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="space-y-3">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
      </div>
    </main>
  )
}

export { PageSkeleton, Skeleton }
