'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowDownToLine, CheckCircle2, Clock3, Wallet } from 'lucide-react'
import { getBusiness } from '@/app/actions/business'
import { getPayouts } from '@/app/actions/storefront'
import { PageSkeleton } from '@/components/ui/skeleton'

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'success' || normalized === 'settled') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive"><CheckCircle2 className="h-3.5 w-3.5" />Paid</span>
  }
  if (normalized === 'failed' || normalized === 'reversed') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-negative/10 px-2.5 py-1 text-xs font-semibold text-negative"><AlertTriangle className="h-3.5 w-3.5" />Failed</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"><Clock3 className="h-3.5 w-3.5" />Pending</span>
}

export default function StorefrontPayoutsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [summary, setSummary] = useState({ total_settled: 0, total_pending: 0, count: 0 })
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getBusiness().then(async (current) => {
      if (!current) return
      setBusiness(current)
      const result = await getPayouts(String(current.id))
      if (result.success) {
        setSummary(result.data.summary)
        setPayouts(result.data.payouts || [])
      } else {
        setError(result.error || 'Unable to load payout history.')
      }
    }).catch(() => setError('Unable to load payout history.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={6} />
  if (!business) return <div className="dashboard-page"><div className="mx-auto max-w-6xl rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">Set up a business to view payout history.</div></div>

  return (
    <main className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Storefront</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Payout history</h1>
          <p className="mt-2 text-sm text-text-secondary">Settlement activity for your business is pulled live from Paystack and filtered to your own payout account.</p>
        </div>

        {error ? <div className="rounded-xl border border-negative/20 bg-surface p-6 text-sm text-negative" role="alert">{error}</div> : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between text-text-muted"><span className="text-sm">Settled</span><Wallet className="h-4 w-4 text-positive" /></div>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">₦{Number(summary.total_settled || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between text-text-muted"><span className="text-sm">Pending</span><Clock3 className="h-4 w-4 text-warning" /></div>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">₦{Number(summary.total_pending || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between text-text-muted"><span className="text-sm">Transactions</span><ArrowDownToLine className="h-4 w-4 text-blue" /></div>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{summary.count}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
              <table className="dashboard-table w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">Settlement</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Reference</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-text-secondary">No settlement activity has been recorded for this account yet.</td></tr>
                  ) : payouts.map((payout) => (
                    <tr key={String(payout.id)} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-semibold text-ink">#{String(payout.id)}</td>
                      <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">₦{Number(payout.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{payout.reference || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{payout.settlement_date ? new Date(payout.settlement_date).toLocaleString() : payout.created_at ? new Date(payout.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
