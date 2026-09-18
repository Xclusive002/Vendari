import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, AtSign, Check, Music2, Phone, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Vendari | Business management app for growing businesses',
  description: 'Meet the team behind Vendari and learn why we are building a clearer business management app for retailers and service businesses.',
  keywords: ['Vendari', 'business management app', 'small business app', 'sales and inventory app', 'business operations'],
  alternates: { canonical: 'https://www.vendari.name.ng/about' },
  openGraph: {
    title: 'About Vendari | Business management app for growing businesses',
    description: 'The story, people, and purpose behind Vendari.',
    url: 'https://www.vendari.name.ng/about',
    type: 'article',
  },
}

const team = [
  { initials: 'EA', name: 'Emmanuel Abiodun Oladipo', role: 'Founder & CTO', bio: 'Leads Vendari&apos;s product direction and technology, turning a close understanding of small-business operations into practical software.' },
  { initials: 'AM', name: 'Ahmed Muhammed Daniel', role: 'Head of Operations', bio: 'Keeps the work around the product focused, coordinated, and close to the businesses Vendari is built to serve.' },
  { initials: 'EA', name: 'Emmanuel Alabi', role: 'Customer Relationship Lead', bio: 'Helps customers be heard, supported, and connected to the people building the product.' },
]

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
          <div className="max-w-4xl"><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue"><Sparkles className="h-4 w-4" /> The story behind Vendari</p><h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] sm:text-7xl">We are building the operating layer small businesses deserve.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">Vendari brings the work behind a business into one clearer place, so owners can spend less time reconstructing yesterday and more time deciding what to do next.</p></div>
          <div className="mt-14 grid max-w-4xl gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Built for</p><p className="mt-2 font-display text-lg font-semibold">Retailers</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Built for</p><p className="mt-2 font-display text-lg font-semibold">Service businesses</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.15em] text-white/45">Stage</p><p className="mt-2 font-display text-lg font-semibold">Active early access</p></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="why-heading">
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
          <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Why it started</p><h2 id="why-heading" className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">The problem was not a lack of effort. It was a lack of visibility.</h2></div>
          <div className="space-y-6 text-base leading-8 text-text-secondary sm:text-lg sm:leading-9"><p>Vendari started from something we kept seeing up close, not something we read in a report. Small business owners were running real, often profitable businesses from memory, a notebook, and a phone full of WhatsApp chats. Their sales, stock, expenses, customer details, and decisions lived in separate places. None of it talked to each other.</p><p>That made an ordinary question unnecessarily difficult: was the business actually profitable last month? The uncertainty was not a sign that owners were incapable. It was a sign that the tools around them were recording activity without making the meaning clear.</p><p>We built Vendari to close that gap. We started with the basics that were missing: a dependable record of sales, inventory, expenses, customers, and day-to-day operations. From there, we are building toward AI that reads a business&apos;s real data and explains, in plain language, what is working, what is changing, and what deserves attention.</p><p>That same direction now reaches beyond the dashboard: automated WhatsApp-based sales logging, a storefront that turns existing inventory into a live online store, and payments that settle directly into the business&apos;s own bank account, never Vendari&apos;s.</p><Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue/20">Explore Vendari with a 5-day trial <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="border-y border-border bg-surface px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="principles-heading">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">How we think</p><h2 id="principles-heading" className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">A practical product, built with conviction.</h2></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{principles.map(([title, copy], index) => <article key={title} className="rounded-xl border border-border bg-bg p-6 shadow-sm"><span className="font-mono text-sm text-blue">0{index + 1}</span><h3 className="mt-8 font-display text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-text-secondary">{copy}</p></article>)}</div></div>
      </section>

      <section className="bg-bg px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="team-heading">
        <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">The team</p><h2 id="team-heading" className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">People close to the work.</h2></div><p className="max-w-sm text-sm leading-6 text-text-secondary">A focused team building the product, running the operation, and staying close to the businesses it serves.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{team.map((member) => <article key={member.name} className="group rounded-xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-gradient font-display text-2xl font-bold text-white">{member.initials}</div><h3 className="mt-6 font-display text-xl font-semibold text-ink">{member.name}</h3><p className="mt-2 text-sm font-semibold text-blue">{member.role}</p><p className="mt-4 text-sm leading-6 text-text-secondary">{member.bio}</p></article>)}</div></div>
      </section>

      <section className="bg-ink px-5 py-20 text-white sm:px-8 sm:py-24" aria-labelledby="today-heading">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Where we are today</p><h2 id="today-heading" className="mt-4 font-display text-3xl font-semibold sm:text-5xl">Early access, with the work already underway.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Vendari is in active early access, onboarding its first businesses and learning directly from the people using it. That stage gives us room to listen closely, improve deliberately, and keep the product anchored to the realities of everyday business.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-6"><p className="text-sm font-semibold text-white">Talk to the team</p><a href="tel:09016615446" className="mt-4 flex items-center gap-3 text-lg font-semibold text-white hover:text-blue"><Phone className="h-5 w-5" />0901 661 5446</a><div className="mt-5 flex gap-3"><a href="https://www.tiktok.com/@vendari_ng?_r=1&_t=ZS-99dm8ICiMdT" target="_blank" rel="noreferrer" aria-label="Vendari on TikTok" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/65 hover:border-blue hover:text-white"><Music2 className="h-4 w-4" /></a><a href="https://x.com/vendarihq?s=11" target="_blank" rel="noreferrer" aria-label="Vendari on X" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/65 hover:border-blue hover:text-white"><AtSign className="h-4 w-4" /></a></div></div></div>
      </section>

      <footer className="border-t border-border bg-surface px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-text-muted"><span>© 2026 Vendari</span><nav className="flex gap-4"><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/terms" className="hover:text-ink">Terms</Link><Link href="/" className="hover:text-ink">Home</Link></nav></div></footer>
    </main>
  )
}
