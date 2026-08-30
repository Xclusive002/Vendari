'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CircleDollarSign, FileText, Lightbulb, Package, Plus, ShoppingCart, Sparkles, Wallet } from 'lucide-react'
import Link from 'next/link'
import { getBusiness, getDashboardSummary, getInsights, getInvoices } from '@/app/actions/business'
import { getCurrentUser, markWelcomeSeen } from '@/app/actions/auth'
import { useCountUp } from '@/hooks/use-count-up'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingButton } from '@/components/ui/loading-button'

type Icon = typeof Wallet
type DashboardSummary = {
  total_sales: number
  orders: number
  total_expenses: number
  profit: number
  trend: Array<{ date: string; amount: number }>
  products: Array<{ name: string; percentage: number }>
  low_stock: Array<[string, number, number]>
}

type MobileTodoItem = {
  id: string
  title: string
  detail: string
  href: string
  tone: 'warning' | 'critical' | 'neutral'
}

function StatCard({ label, value, prefix = '', trend, icon: IconComponent, negative = false }: { label: string; value: number; prefix?: string; trend?: string; icon: Icon; negative?: boolean }) {
  const count = useCountUp(value)
  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between"><p className="text-sm font-medium text-text-secondary">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue/10 text-blue"><IconComponent className="h-4 w-4" /></span></div>
      <p className="mt-5 font-mono text-2xl font-medium tracking-tight text-ink">{prefix}{count.toLocaleString()}</p>
      {trend && <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${negative ? 'text-negative' : 'text-positive'}`}>{negative ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{trend}<span className="font-normal text-text-muted">vs last month</span></p>}
    </article>
  )
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<{ id: string; business_name: string } | null>(null)
  const [summary, setSummary] = useState<DashboardSummary>({ total_sales: 0, orders: 0, total_expenses: 0, profit: 0, trend: [], products: [], low_stock: [] })
  const [insights, setInsights] = useState<any[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileTodos, setMobileTodos] = useState<MobileTodoItem[]>([])

  useEffect(() => {
    let loadVersion = 0
    let loadingRequest = false

    async function load() {
      if (loadingRequest) return
      loadingRequest = true
      const currentLoad = ++loadVersion
      try {
        const currentBusiness = await getBusiness()
        if (!currentBusiness) {
          setLoading(false)
          return
        }
        if (currentLoad !== loadVersion) return
        setBusiness(currentBusiness)

        const summaryResult = await getDashboardSummary(currentBusiness.id)
        if (currentLoad !== loadVersion) return
        const nextSummary = summaryResult.success ? summaryResult.data : { total_sales: 0, orders: 0, total_expenses: 0, profit: 0, trend: [], products: [], low_stock: [] }
        setSummary(nextSummary)

        const invoiceResult = await getInvoices(currentBusiness.id, undefined, 'unpaid')
        const invoices = invoiceResult.success ? invoiceResult.data || [] : []
        const today = new Date()
        const dueSoon = invoices.filter((invoice: any) => {
          if (!invoice.due_date) return false
          const due = new Date(invoice.due_date)
          return due < today || invoice.status === 'unpaid'
        })

        const mobileItems: MobileTodoItem[] = [
          ...((nextSummary.low_stock || []).slice(0, 2).map(([name, quantity, reorder]) => ({
            id: `low-stock-${name}`,
            title: `${name} is low`,
            detail: `${quantity} left • reorder at ${reorder}`,
            href: '/dashboard/inventory',
            tone: 'critical' as const,
          }))),
          ...dueSoon.slice(0, 2).map((invoice: any) => ({
            id: `invoice-${invoice.id}`,
            title: invoice.doc_number || 'Invoice due',
            detail: `${invoice.customer_name || 'Customer'} • ${invoice.status === 'unpaid' ? 'Unpaid' : 'Overdue'}`,
            href: '/dashboard/invoices',
            tone: 'warning' as const,
          })),
        ]
        setMobileTodos(mobileItems)

        setLoading(false)
        getCurrentUser().then((currentUser) => {
          if (currentLoad === loadVersion) setShowWelcome(currentUser?.has_seen_welcome === false)
        })
        getInsights(currentBusiness.id).then((insightResult) => {
          if (currentLoad === loadVersion) setInsights(insightResult.data || [])
        }).catch(() => setInsights([]))
      } finally {
        loadingRequest = false
      }
    }
    load()
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', refreshOnReturn)
    window.addEventListener('pageshow', refreshOnReturn)
    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => {
      window.removeEventListener('focus', refreshOnReturn)
      window.removeEventListener('pageshow', refreshOnReturn)
      document.removeEventListener('visibilitychange', refreshOnReturn)
    }
  }, [])

  if (loading) return <main className="min-h-screen bg-bg px-5 pb-12 pt-20 sm:px-8 md:pt-8"><div className="mx-auto max-w-7xl space-y-6"><div className="space-y-3"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-96 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}</div><div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div><div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div></div></main>

  const totalSales = Number(summary.total_sales || 0)
  const orders = Number(summary.orders || 0)
  const profit = Number(summary.profit || 0)
  const lowStock = summary.low_stock || []
  const products: Array<[string, number]> = summary.products.map((product) => [product.name, product.percentage])
  const trend = summary.trend.map((point) => ({ date: new Date(`${point.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount: Number(point.amount || 0) }))
  const insight = insights[0]

  const quickActions = [
    { label: 'Record Sale', href: '/dashboard/sales', icon: ShoppingCart },
    { label: 'Add Product', href: '/dashboard/inventory', icon: Plus },
    { label: 'View Reports', href: '/dashboard/reports', icon: FileText },
    { label: 'Get Support', href: '/concierge-inquiry', icon: Sparkles },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      {showWelcome && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-5 py-8" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><div className="welcome-modal relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-2xl sm:p-8"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue/10" /><div className="relative"><p className="text-sm font-semibold text-blue">A clear start</p><h2 id="welcome-title" className="mt-2 font-display text-2xl font-semibold text-ink">Welcome to Vendari, {business?.business_name}.</h2><p className="mt-3 text-sm leading-6 text-text-secondary">Add your first inventory item, then record a sale when you are ready. Vendari will keep the important numbers in view as your business gets moving.</p><LoadingButton type="button" onClick={async () => { await markWelcomeSeen(); setShowWelcome(false) }} className="dashboard-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-lg shadow-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">Let&apos;s get started</LoadingButton></div></div></div>}

      <div className="hidden md:block">
        <main className="min-h-screen bg-bg px-5 pb-12 pt-20 sm:px-8 md:pt-8">
          <div className="mx-auto max-w-7xl"><p className="text-sm text-text-muted">{new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p><h1 className="mt-1 font-display text-3xl font-semibold text-ink">{getGreeting()}{business?.business_name ? `, ${business.business_name}` : ''}.</h1><p className="mt-2 text-sm text-text-secondary">Here is what is happening across your business today.</p></div>

          <section className="mx-auto mt-8 max-w-7xl" aria-labelledby="overview-heading"><h2 id="overview-heading" className="sr-only">Business overview</h2><div className="grid gap-4 md:grid-cols-3"><StatCard label="Total Sales" value={totalSales} prefix="₦" icon={CircleDollarSign} /><StatCard label="Orders" value={orders} icon={ShoppingCart} /><StatCard label="Profit" value={profit} prefix="₦" icon={Wallet} /></div></section>

          <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.45fr_1fr]" aria-label="Sales and top products">
            <article className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-text-secondary">Sales over time</p><p className="mt-1 font-mono text-xl text-ink">₦{totalSales.toLocaleString()}</p></div></div><div className="mt-6 h-[250px] w-full">{trend.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4683EC" stopOpacity={0.28} /><stop offset="100%" stopColor="#4954F1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#E3E8F1" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8792A2', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8792A2', fontSize: 11 }} tickFormatter={(value) => `₦${Math.round(value / 1000)}k`} /><Tooltip contentStyle={{ border: '1px solid #E3E8F1', borderRadius: 8, fontSize: 12 }} formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Sales']} /><Area type="monotone" dataKey="amount" stroke="#4683EC" strokeWidth={3} fill="url(#salesFill)" /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-text-muted">Record your first sale to see trends here</div>}</div></article>
            <article className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-text-secondary">Top products</p><p className="mt-1 text-xs text-text-muted">By sales this month</p></div><Package className="h-4 w-4 text-blue" /></div><div className="mt-7 space-y-5">{products.length ? products.map(([name, percentage], index) => <div key={name} className="flex items-center gap-3"><span className="font-mono text-xs text-text-muted">0{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="truncate text-sm font-medium text-ink">{name}</span><span className="font-mono text-xs text-text-muted">{percentage}%</span></div><div className="mt-2 h-1.5 rounded-full bg-bg"><div className="h-1.5 rounded-full bg-brand-gradient" style={{ width: `${percentage}%` }} /></div></div></div>) : <p className="text-sm text-text-muted">No sales recorded yet.</p>}</div></article>
          </section>

          <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1fr_1.35fr]" aria-label="Stock alerts and AI insights">
            <article className="rounded-xl border border-warning/25 bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /><h2 className="font-display text-lg font-semibold text-ink">Low stock alerts</h2></div><span className="rounded-full bg-negative/10 px-2 py-1 text-xs font-medium text-negative">{lowStock.length} items</span></div><div className="mt-5 space-y-3">{lowStock.length ? lowStock.map(([name, quantity, reorder]) => <div key={name} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3"><div><p className="text-sm font-medium text-ink">{name}</p><p className="mt-1 text-xs text-text-muted">Reorder at {reorder}</p></div><p className="font-mono text-sm font-medium text-negative">{quantity} left</p></div>) : <p className="text-sm text-text-muted">Add inventory items to start tracking stock levels.</p>}</div></article>
            <article className="rounded-xl bg-ink p-5 text-white shadow-sm sm:p-6"><div className="flex items-center gap-2 text-blue"><Lightbulb className="h-4 w-4" /><h2 className="font-display text-lg font-semibold">AI insights</h2></div>{insight ? <><p className="mt-5 font-display text-xl font-semibold leading-snug">{insight.summary_text}</p><div className="mt-6 grid gap-4 border-t border-white/10 pt-4 text-xs sm:grid-cols-2"><div><p className="text-white/45">Computed from your real numbers</p><p className="mt-1 font-mono text-white/80">Sales + stock + purchases</p></div><div><p className="text-white/45">AI explanation</p><p className="mt-1 text-white/75">This explanation is based on your latest business data.</p></div></div></> : <p className="mt-5 font-display text-xl font-semibold leading-snug">Insights appear here once you&apos;ve recorded a few days of sales and inventory activity — check back soon.</p>}</article>
          </section>

          <section className="mx-auto mt-6 max-w-7xl rounded-xl border border-blue/20 bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="concierge-promo-heading">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">VENDARI CONCIERGE</p><h2 id="concierge-promo-heading" className="mt-3 font-display text-2xl font-semibold text-ink">Ready for more customers to find you?</h2><p className="mt-3 text-sm leading-6 text-text-secondary">Vendari Concierge pairs you with a dedicated growth officer who builds your website, sets up your Google listing, and runs your ads — using your real sales data to know what to promote. You keep ownership of everything; your officer just runs it.</p></div>
              <Link href="/dashboard/concierge" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white">Learn about Concierge <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </main>
      </div>

      <div className="md:hidden">
        <main className="min-h-screen bg-bg px-4 pb-28 pt-5">
          <div className="mx-auto max-w-sm">
            <header className="mb-4 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{getGreeting()}{business?.business_name ? `, ${business.business_name}` : ''}.</h1>
            </header>

            <section className="grid grid-cols-2 gap-3">
              <article className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Total Sales</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10 text-blue"><CircleDollarSign className="h-4 w-4" /></span>
                </div>
                <p className="mt-4 font-mono text-xl font-semibold tracking-tight text-ink">₦{Number(totalSales).toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Orders</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10 text-blue"><ShoppingCart className="h-4 w-4" /></span>
                </div>
                <p className="mt-4 font-mono text-xl font-semibold tracking-tight text-ink">{orders.toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Profit</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/10 text-blue"><Wallet className="h-4 w-4" /></span>
                </div>
                <p className="mt-4 font-mono text-xl font-semibold tracking-tight text-ink">₦{Number(profit).toLocaleString()}</p>
              </article>
              <article className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Low stock</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning"><AlertTriangle className="h-4 w-4" /></span>
                </div>
                <p className="mt-4 font-mono text-xl font-semibold tracking-tight text-ink">{lowStock.length}</p>
              </article>
            </section>

            <section className="mt-5 rounded-2xl border border-border bg-surface p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">To-do</h2>
                <span className="rounded-full bg-bg px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">{mobileTodos.length} items</span>
              </div>

              {mobileTodos.length ? (
                <div className="space-y-2">
                  {mobileTodos.map((item) => (
                    <Link key={item.id} href={item.href} className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${item.tone === 'critical' ? 'border-negative/20 bg-negative/5' : item.tone === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-border bg-bg'}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.tone === 'critical' ? 'bg-negative/10 text-negative' : item.tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-blue/10 text-blue'}`}>
                        {item.tone === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-text-secondary">{item.detail}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-text-muted" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-bg px-3 py-4 text-sm text-text-secondary">Everything looks clear right now.</p>
              )}
            </section>

            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Quick actions</h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map(({ label, href, icon: Icon }) => (
                  <Link key={label} href={href} className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-2 text-center shadow-sm ring-1 ring-border">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-blue/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-medium leading-tight text-text-secondary">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl bg-ink p-4 text-white shadow-sm">
              <div className="flex items-center gap-2 text-blue">
                <Lightbulb className="h-4 w-4" />
                <h2 className="font-display text-lg font-semibold">AI insights</h2>
              </div>
              {insight ? (
                <>
                  <p className="mt-3 text-base font-medium leading-6 text-white">{insight.summary_text}</p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                    {insight.analysis_text || 'This insight is based on your current sales, stock, and expense patterns.'}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-white/70">Insights will appear as more business data is tracked.</p>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
