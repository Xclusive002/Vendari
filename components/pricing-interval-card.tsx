'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'

const features = [
  '5-day free membership trial',
  'Sales logging and sales history',
  'Inventory, stock levels, low-stock alerts, and restocking',
  'Customer records and customer purchase history',
  'Expense tracking and financial summaries',
  'Invoices, receipts, and invoice payment links',
  'Dashboard totals, trends, profit, and top-product reporting',
  'Advanced reports and downloadable report exports',
  'AI questions, AI insights, and forecasting',
  'Voice entry for sales and inventory',
  'WhatsApp sales, inventory restocks, and customer logging by text or voice note',
  'Team members, staff roles, invitations, and activity controls',
  'Business profile, settings, notifications, and secure account access',
  'All future Vendari product improvements included in membership',
]

export function PricingIntervalCard() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const yearly = interval === 'yearly'

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mx-auto mb-7 flex w-fit rounded-full border border-border bg-bg p-1" role="group" aria-label="Choose billing interval">
        {(['monthly', 'yearly'] as const).map((option) => (
          <button key={option} type="button" onClick={() => setInterval(option)} aria-pressed={interval === option} className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all ${interval === option ? 'bg-brand-gradient text-white shadow-sm' : 'text-text-secondary hover:text-ink'}`}>
            {option}
            {option === 'yearly' && <span className="ml-2 text-xs">2 months free</span>}
          </button>
        ))}
      </div>
      <article className="relative rounded-xl border border-blue bg-surface p-6 shadow-[var(--shadow-modal)] ring-2 ring-blue/20 sm:p-8">
        <span className="absolute right-5 top-5 rounded-full bg-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue">Full membership</span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Pro</p>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Your complete Vendari membership</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3"><span className="font-mono text-3xl font-semibold text-ink">₦{yearly ? '99,999' : '9,999'}</span><span className="text-sm text-text-muted">per {yearly ? 'year' : 'month'}</span>{yearly && <span className="rounded-full bg-positive/10 px-3 py-1 text-sm font-bold text-positive">Save ₦19,989 · 2 months free</span>}</div>
        <p className="mt-5 text-sm leading-6 text-text-secondary">One membership gives you the complete Vendari workspace. Nothing is held back as an upgrade.</p>
        <Link href="/register" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-white">Become a member <ArrowRight className="h-4 w-4" /></Link>
        <div className="mt-7 border-t border-border pt-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Your membership includes</p><ul className="mt-4 grid gap-3 sm:grid-cols-2">{features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-5 text-text-secondary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />{feature}</li>)}</ul></div>
      </article>
    </div>
  )
}
