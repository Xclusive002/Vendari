import { ConciergeDetail } from '@/components/concierge-content'
import { BackButton } from '@/components/ui/back-button'

export default function DashboardConciergePage() {
  return (
    <main className="dashboard-page px-5 pb-16 pt-10 md:pl-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <BackButton fallback="/dashboard">Back to previous page</BackButton>
        <div className="mt-10"><ConciergeDetail /></div>
      </div>
    </main>
  )
}
