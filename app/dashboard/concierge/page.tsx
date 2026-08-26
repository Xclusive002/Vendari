import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ConciergeDetail } from '@/components/concierge-content'

export default function DashboardConciergePage() {
  return (
    <main className="dashboard-page px-5 pb-16 pt-10 md:pl-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-ink"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link>
        <div className="mt-10"><ConciergeDetail /></div>
      </div>
    </main>
  )
}
