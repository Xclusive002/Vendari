import Link from 'next/link'
import { LockKeyhole, ArrowRight } from 'lucide-react'

export function LockedFeature({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-blue/20 bg-blue/5 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue/10 text-blue">
          <LockKeyhole className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
          <Link href="/dashboard/settings/billing" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue">
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}