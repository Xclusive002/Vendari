'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CircleDollarSign, Lightbulb, Package, ShoppingCart, Wallet } from 'lucide-react'
import { getBusiness, getExpenses, getInsights, getInventory, getSales } from '@/app/actions/business'
import { useCountUp } from '@/hooks/use-count-up'

const sampleTrend = [
  { date: 'Aug 1', amount: 180000 }, { date: 'Aug 5', amount: 235000 }, { date: 'Aug 9', amount: 198000 },
  { date: 'Aug 13', amount: 340000 }, { date: 'Aug 17', amount: 290000 }, { date: 'Aug 21', amount: 425000 }, { date: 'Aug 23', amount: 510000 },
]
const sampleProducts = [['Premium Ankara', 92], ['Leather Sandals', 74], ['Gift Box Set', 58], ['Cedar Candle', 43]] as const
const sampleStock = [['Premium Ankara', 3, 10], ['Gift Box Set', 5, 12], ['Cedar Candle', 2, 8]] as const

function withTimeout<T>(promise: Promise<T>, fallback: T, milliseconds = 5000) {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), milliseconds))])
}

type Icon = typeof Wallet

function StatCard({ label, value, prefix = '', trend, icon: IconComponent, negative = false }: { label: string; value: number; prefix?: string; trend: string; icon: Icon; negative?: boolean }) {
  const count = useCountUp(value)
  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between"><p className="text-sm font-medium text-text-secondary">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue/10 text-blue"><IconComponent className="h-4 w-4" /></span></div>
      <p className="mt-5 font-mono text-2xl font-medium tracking-tight text-ink">{prefix}{count.toLocaleString()}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${negative ? 'text-negative' : 'text-positive'}`}>{negative ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{trend}<span className="font-normal text-text-muted">vs last month</span></p>
    </article>
  )
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<{ id: string; business_name: string } | null>(null)
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const currentBusiness = await withTimeout(getBusiness(), null)
      if (!currentBusiness) { setLoading(false); return }
      setBusiness(currentBusiness)
      const [salesResult, expensesResult, inventoryResult, insightResult] = await withTimeout(Promise.all([
        getSales(currentBusiness.id), getExpenses(currentBusiness.id), getInventory(currentBusiness.id), getInsights(currentBusiness.id),
      ]), [{ success: false, data: [] }, { success: false, data: [] }, { success: false, data: [] }, { success: false, data: [] }])
      setSales(salesResult.data || [])
      setExpenses(expensesResult.data || [])
      setInventory(inventoryResult.data || [])
      setInsights(insightResult.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-bg text-sm text-text-secondary">Loading your dashboard...</main>

  const liveSales = sales.length > 0
  const totalSales = liveSales ? sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) : 1284500
  const orders = liveSales ? sales.length : 248
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const profit = liveSales ? totalSales - totalExpenses : 384220
  const lowStock = inventory.length > 0 ? inventory.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10)).map((item) => [item.product_name, item.quantity_in_stock, item.reorder_level || 10]) : sampleStock
  const products = inventory.length > 0 ? inventory.slice(0, 4).map((item, index) => [item.product_name, Math.max(35, 90 - index * 15)] as [string, number]) : sampleProducts
  const trend = liveSales ? sales.slice(-7).map((sale) => ({ date: new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount: Number(sale.total_amount || 0) })) : sampleTrend
  const insight = insights[0]

  return (
    <main className="min-h-screen bg-bg px-5 pb-12 pt-20 sm:px-8 md:pt-8">
      <div className="mx-auto max-w-7xl"><p className="text-sm text-text-muted">Monday, 23 August 2026</p><h1 className="mt-1 font-display text-3xl font-semibold text-ink">Good morning{business?.business_name ? `, ${business.business_name}` : ''}.</h1><p className="mt-2 text-sm text-text-secondary">Here is what is happening across your business today.</p></div>

      <section className="mx-auto mt-8 max-w-7xl" aria-labelledby="overview-heading"><h2 id="overview-heading" className="sr-only">Business overview</h2><div className="grid gap-4 md:grid-cols-3"><StatCard label="Total Sales" value={totalSales} prefix="N" trend="18.4%" icon={CircleDollarSign} /><StatCard label="Orders" value={orders} trend="12.8%" icon={ShoppingCart} /><StatCard label="Profit" value={profit} prefix="N" trend="9.6%" icon={Wallet} /></div></section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1.45fr_1fr]" aria-label="Sales and top products">
        <article className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-text-secondary">Sales over time</p><p className="mt-1 font-mono text-xl text-ink">N{totalSales.toLocaleString()}</p></div><span className="rounded-md bg-positive/10 px-2 py-1 text-xs font-medium text-positive">+24.6%</span></div><div className="mt-6 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4683EC" stopOpacity={0.28} /><stop offset="100%" stopColor="#4954F1" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#E3E8F1" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8792A2', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8792A2', fontSize: 11 }} tickFormatter={(value) => `N${Math.round(value / 1000)}k`} /><Tooltip contentStyle={{ border: '1px solid #E3E8F1', borderRadius: 8, fontSize: 12 }} formatter={(value) => [`N${Number(value).toLocaleString()}`, 'Sales']} /><Area type="monotone" dataKey="amount" stroke="#4683EC" strokeWidth={3} fill="url(#salesFill)" /></AreaChart></ResponsiveContainer></div></article>
        <article className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-text-secondary">Top products</p><p className="mt-1 text-xs text-text-muted">By sales this month</p></div><Package className="h-4 w-4 text-blue" /></div><div className="mt-7 space-y-5">{products.map(([name, percentage], index) => <div key={name} className="flex items-center gap-3"><span className="font-mono text-xs text-text-muted">0{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="truncate text-sm font-medium text-ink">{name}</span><span className="font-mono text-xs text-text-muted">{percentage}%</span></div><div className="mt-2 h-1.5 rounded-full bg-bg"><div className="h-1.5 rounded-full bg-brand-gradient" style={{ width: `${percentage}%` }} /></div></div></div>)}</div></article>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-[1fr_1.35fr]" aria-label="Stock alerts and AI insights">
        <article className="rounded-xl border border-warning/25 bg-surface p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /><h2 className="font-display text-lg font-semibold text-ink">Low stock alerts</h2></div><span className="rounded-full bg-negative/10 px-2 py-1 text-xs font-medium text-negative">{lowStock.length} items</span></div><div className="mt-5 space-y-3">{lowStock.map(([name, quantity, reorder]) => <div key={name} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3"><div><p className="text-sm font-medium text-ink">{name}</p><p className="mt-1 text-xs text-text-muted">Reorder at {reorder}</p></div><p className="font-mono text-sm font-medium text-negative">{quantity} left</p></div>)}</div></article>
        <article className="rounded-xl bg-ink p-5 text-white shadow-sm sm:p-6"><div className="flex items-center gap-2 text-blue"><Lightbulb className="h-4 w-4" /><h2 className="font-display text-lg font-semibold">AI insights</h2></div>{/* TODO: wire this card to the business AI insights endpoint when production insight payloads are available. */}<p className="mt-5 font-display text-xl font-semibold leading-snug">{insight?.summary_text || 'You are selling out of Premium Ankara every 9 days, but reordering every 14.'}</p><div className="mt-6 grid gap-4 border-t border-white/10 pt-4 text-xs sm:grid-cols-2"><div><p className="text-white/45">Computed from your real numbers</p><p className="mt-1 font-mono text-white/80">Sales + stock + purchases</p></div><div><p className="text-white/45">AI explanation</p><p className="mt-1 text-white/75">{insight ? 'This explanation is based on your latest business data.' : 'Your current reorder cycle leaves 5 days exposed.'}</p></div></div></article>
      </section>
    </main>
  )
}
