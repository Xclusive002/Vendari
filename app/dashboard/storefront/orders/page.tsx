'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, ShoppingBag } from 'lucide-react'
import { getBusiness } from '@/app/actions/business'
import { getStorefrontOrders } from '@/app/actions/storefront'
import { PageSkeleton } from '@/components/ui/skeleton'

function PayoutBadge({ status }: { status: 'pending' | 'settled' | 'failed' }) {
  if (status === 'settled') return <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive"><CheckCircle2 className="h-3.5 w-3.5" />Paid to your account</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1 rounded-full bg-negative/10 px-2.5 py-1 text-xs font-semibold text-negative"><AlertTriangle className="h-3.5 w-3.5" />Payout failed</span>
  return <span title="Payouts typically arrive within 1 business day" className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"><Clock3 className="h-3.5 w-3.5" />Payout pending</span>
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">Payment confirmed</span>
  if (status === 'cancelled') return <span className="rounded-full bg-negative/10 px-2.5 py-1 text-xs font-semibold text-negative">Cancelled</span>
  if (status === 'pending_whatsapp') return <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">Awaiting WhatsApp order</span>
  return <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">Awaiting payment</span>
}

export default function StorefrontOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getBusiness().then(async (business) => {
      if (!business) return
      const result = await getStorefrontOrders(String(business.id))
      if (result.success) setOrders(result.data)
      else setError(result.error)
    }).catch(() => setError('Unable to load storefront orders.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton rows={5} />
  return <main className="dashboard-page md:pl-8"><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Storefront</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">Orders</h1><p className="mt-2 text-sm text-text-secondary">Customer payment and payout settlement are tracked separately.</p></div>{error ? <div className="rounded-xl border border-negative/20 bg-surface p-6 text-sm text-negative" role="alert">{error}</div> : orders.length === 0 ? <div className="dashboard-empty rounded-xl border border-dashed border-border bg-surface"><ShoppingBag className="h-8 w-8 text-blue" /><p>No storefront orders yet.</p><p className="text-sm text-text-muted">Published-store orders will appear here after a customer checks out.</p></div> : <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]"><table className="dashboard-table w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border"><th className="px-4 py-3 text-left font-semibold">Order</th><th className="px-4 py-3 text-left font-semibold">Customer</th><th className="px-4 py-3 text-left font-semibold">Items</th><th className="px-4 py-3 text-right font-semibold">Total</th><th className="px-4 py-3 text-left font-semibold">Payment</th><th className="px-4 py-3 text-left font-semibold">Payout</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="px-4 py-3 font-semibold text-ink">#{order.id}<span className="mt-1 block text-xs font-normal text-text-muted">{new Date(order.created_at).toLocaleDateString()}</span></td><td className="px-4 py-3 text-text-secondary">{order.customer_name}</td><td className="px-4 py-3 text-text-secondary">{order.line_items.map((item: any) => `${item.product_name} x${item.quantity}`).join(', ')}</td><td className="dashboard-number px-4 py-3 text-right font-semibold text-ink">N{Number(order.total).toLocaleString()}</td><td className="px-4 py-3"><PaymentBadge status={order.status} /></td><td className="px-4 py-3">{order.status === 'paid' ? <><PayoutBadge status={order.payout_status} />{order.payout_status === 'pending' && <span className="mt-1 block text-xs text-text-muted">Usually within 1 business day</span>}</> : <span className="text-xs text-text-muted">Not applicable</span>}</td></tr>)}</tbody></table></div>}</div></main>
}
