import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, AtSign, Music2, Phone, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Vendari | Business management app for growing businesses',
  description: 'Learn how ProfitPilot began in 2022, why it became Vendari in 2026, and how we are building a more trustworthy operating system for growing businesses.',
  keywords: ['Vendari', 'business management app', 'small business app', 'sales and inventory app', 'business operations'],
  alternates: { canonical: 'https://www.vendari.name.ng/about' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'About Vendari | Business management app for growing businesses',
    description: 'The story, purpose, and principles behind Vendari.',
    url: 'https://www.vendari.name.ng/about',
    type: 'article',
  },
}

const principles = [
  ['Clarity over complexity', 'Business software should explain what changed and what deserves attention, not make owners decode another dashboard.'],
  ['Built around real work', 'Sales, stock, expenses, customers, WhatsApp conversations, and payments belong in the same operating picture.'],
  ['Trust is part of the product', 'We aim to be direct about payments, data, pricing, and where Vendari is in its journey.'],
]

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg text-text-primary">
      <header className="border-b border-border bg-surface/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-xl font-semibold text-ink">Vendari</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-ink px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-blue/25" aria-hidden="true" />
        <div className="absolute -bottom-40 left-1/2 h-72 w-72 rounded-full border border-violet/20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl"><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue"><Sparkles className="h-4 w-4" /> The story behind Vendari</p><h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] sm:text-7xl">From ProfitPilot to Vendari: building business software people can trust.</h1><p className="mt-7 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">Vendari exists because running a growing business should not require an owner to become a full-time accountant, stock controller, customer database, and data analyst at once.</p></div>
          <div className="mt-14 grid max-w-4xl gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Built for</p><p className="mt-2 font-display text-lg font-semibold">Retailers</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Built for</p><p className="mt-2 font-display text-lg font-semibold">Service businesses</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Stage</p><p className="mt-2 font-display text-lg font-semibold">Active early access</p></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="why-heading">
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
          <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Why it started</p><h2 id="why-heading" className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">The problem was not a lack of effort. It was a lack of visibility.</h2></div>
          <div className="space-y-6 text-base leading-8 text-text-secondary sm:text-lg sm:leading-9"><p>Vendari began with a simple observation: many owners were doing the hard work of running a business, but the information needed to make good decisions was scattered across notebooks, spreadsheets, receipts, bank alerts, and WhatsApp chats. A sale might be recorded in one place, the stock movement remembered somewhere else, and the expense that reduced the margin never connected to either.</p><p>This creates a serious but quiet problem. Owners can be busy every day and still be unsure which products make money, whether stock is disappearing, when to reorder, what customers owe, or whether growth is actually improving the business. The problem is not a lack of discipline or ambition. It is that disconnected tools produce disconnected answers.</p><p>Vendari is designed as one operating picture for the business. Sales, inventory, expenses, customers, invoices, reports, storefront activity, and payments should reinforce each other. The goal is not to bury an owner under more dashboards. It is to make the next decision clearer: what sold, what changed, what is at risk, and what deserves attention now.</p><p>We are also careful about what automation means. AI should not invent certainty or hide the source of an answer. It should help interpret the records a business already has, surface useful patterns, and explain them in language a busy owner can act on. When a decision needs human judgment, the product should make that visible rather than pretending otherwise.</p><Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue/20">Explore Vendari with a 5-day trial <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="border-y border-border bg-bg px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="journey-heading">
        <div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Our journey</p><h2 id="journey-heading" className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">The name changed. The problem we care about did not.</h2><p className="mt-5 text-base leading-8 text-text-secondary sm:text-lg">The transition from ProfitPilot to Vendari is a story of focus. We started with a name that described one outcome, then grew into a product that supports the many connected jobs required to reach it.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-2"><article className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"><p className="font-mono text-sm font-semibold text-blue">2022</p><h3 className="mt-5 font-display text-2xl font-semibold text-ink">ProfitPilot begins</h3><p className="mt-4 text-sm leading-7 text-text-secondary">ProfitPilot began as an attempt to help business owners get closer to the numbers behind their work. The early idea was straightforward: if owners could see sales, costs, and performance more clearly, they could make better decisions with less guesswork. That first chapter taught us that profit is never an isolated report. It depends on stock, customers, operations, timing, and the quality of the records underneath it.</p></article><article className="rounded-xl border border-blue/20 bg-blue/5 p-6 shadow-sm sm:p-8"><p className="font-mono text-sm font-semibold text-blue">2026</p><h3 className="mt-5 font-display text-2xl font-semibold text-ink">ProfitPilot becomes Vendari</h3><p className="mt-4 text-sm leading-7 text-text-secondary">In 2026, we rebranded as Vendari to reflect the wider product we were building. The new name represents a business companion that helps owners sell, organize, understand, and grow, not only calculate profit after the fact. The rebrand is not a reset or a claim that everything is finished. It is an honest marker of direction: a broader platform, a clearer promise, and a commitment to keep earning trust through useful work.</p></article></div></div>
      </section>

      <section className="border-y border-border bg-surface px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="principles-heading">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">How we think</p><h2 id="principles-heading" className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">A practical product, built with conviction.</h2></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{principles.map(([title, copy], index) => <article key={title} className="rounded-xl border border-border bg-bg p-6 shadow-sm"><span className="font-mono text-sm text-blue">0{index + 1}</span><h3 className="mt-8 font-display text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-text-secondary">{copy}</p></article>)}</div></div>
      </section>

      <section className="bg-ink px-5 py-20 text-white sm:px-8 sm:py-24" aria-labelledby="today-heading">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Where we are today</p><h2 id="today-heading" className="mt-4 font-display text-3xl font-semibold sm:text-5xl">Early access, with the work already underway.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Vendari is in active early access, onboarding its first businesses and learning directly from the people using it. That stage gives us room to listen closely, improve deliberately, and keep the product anchored to the realities of everyday business.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-6"><p className="text-sm font-semibold text-white">Talk to the team</p><a href="tel:09016615446" className="mt-4 flex items-center gap-3 text-lg font-semibold text-white hover:text-blue"><Phone className="h-5 w-5" />0901 661 5446</a><div className="mt-5 flex gap-3"><a href="https://www.tiktok.com/@vendari_ng?_r=1&_t=ZS-99dm8ICiMdT" target="_blank" rel="noreferrer" aria-label="Vendari on TikTok" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/65 hover:border-blue hover:text-white"><Music2 className="h-4 w-4" /></a><a href="https://x.com/vendarihq?s=11" target="_blank" rel="noreferrer" aria-label="Vendari on X" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/65 hover:border-blue hover:text-white"><AtSign className="h-4 w-4" /></a></div></div></div>
      </section>

      <footer className="border-t border-border bg-surface px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-text-muted"><span>© 2026 Vendari</span><nav className="flex gap-4"><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/terms" className="hover:text-ink">Terms</Link><Link href="/" className="hover:text-ink">Home</Link></nav></div></footer>
    </main>
  )
}
