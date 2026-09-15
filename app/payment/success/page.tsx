'use client'

import Link from 'next/link'
import { CheckCircle2, Clock3 } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-positive/10 text-positive"><CheckCircle2 className="h-7 w-7" /></div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Payment received</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">Paystack has returned you to Vendari. Your membership will be activated after the payment confirmation reaches us.</p>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue/20 bg-blue/5 p-4 text-left"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue" /><p className="text-sm leading-6 text-text-secondary">This usually takes a few moments. Your Membership page will show the new status once confirmation is complete.</p></div>
        <Link href="/dashboard/settings/billing" className="dashboard-primary mt-7 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold">View Membership</Link>
      </section>
    </main>
  )
}
