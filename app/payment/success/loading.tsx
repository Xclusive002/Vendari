import { Skeleton } from '@/components/ui/skeleton'

export default function SuccessLoading() {
  return (
    <main className="dashboard-page" aria-label="Loading payment confirmation">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-56" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-sm" />
        <Skeleton className="mx-auto mt-8 h-11 w-40" />
      </div>
    </main>
  )
}
