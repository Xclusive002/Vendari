import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Headphones, Sparkles, Users } from 'lucide-react'
import { PricingIntervalCard } from '@/components/pricing-interval-card'

export const metadata: Metadata = {
  title: 'Pricing | Vendari',
  description: 'Simple Vendari pricing for sales, inventory, customers, reporting, and daily business operations.',
  alternates: {
    canonical: 'https://www.vendari.name.ng/pricing',
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <nav className="border-b border-border bg-surface/95" aria-label="Pricing navigation">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-xl font-bold text-ink">Vendari</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-bg">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white">Start now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-border bg-surface px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Vendari membership</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">Everything Vendari does, in one membership.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">Start now with a free 5-day membership trial. Choose monthly or yearly billing after your trial. There are no feature tiers and no upgrade path.</p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <PricingIntervalCard />
      </section>

      <section className="border-y border-border bg-ink px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Separate managed service</p><h2 className="mt-4 font-display text-3xl font-semibold sm:text-5xl">Need someone to execute the growth work?</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Vendari Concierge is not a software package or subscription tier. It is a separate managed service for businesses that want a growth officer to help with their website, Google presence, campaign setup, and promotion decisions.</p><p className="mt-5 text-sm font-medium text-white/80">Setup starts around ₦50,000. Ongoing management is scoped separately around your business.</p><Link href="/dashboard/concierge" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white">Talk about Concierge <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Sparkles className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Software plus insight</p><p className="mt-2 text-sm leading-6 text-white/60">Your recommendations come from your own sales and customer patterns.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Users className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Built for teams</p><p className="mt-2 text-sm leading-6 text-white/60">Bring operators and owners into one shared view of the work.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Headphones className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Human support</p><p className="mt-2 text-sm leading-6 text-white/60">Get practical help when the business needs execution, not another setting.</p></div></div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-3xl"><h2 className="font-display text-3xl font-semibold text-ink">How Vendari membership works</h2><div className="mt-8 grid gap-6 sm:grid-cols-3"><div><p className="font-mono text-sm text-blue">01</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">Start as a member</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Create your business workspace and use every Vendari feature during your free 5-day trial.</p></div><div><p className="font-mono text-sm text-blue">02</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">Keep the whole workspace</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Your sales, customers, inventory, expenses, reports, and team records stay together.</p></div><div><p className="font-mono text-sm text-blue">03</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">Choose how to continue</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Keep the complete Vendari membership active monthly or save two months by paying yearly.</p></div></div></div></section>

      <footer className="bg-ink px-5 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs text-white/50"><Link href="/" className="font-display text-lg font-semibold text-white">Vendari</Link><span>Business operations, with less guesswork.</span><span>© 2026 Vendari</span></div></footer>
    </main>
  )
}
