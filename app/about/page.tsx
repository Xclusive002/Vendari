import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, AtSign, Music2, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Vendari | The story behind the product',
  description: 'The founding story behind Vendari and the person building it.',
  alternates: { canonical: 'https://www.vendari.name.ng/about' },
}

const team = [
  {
    name: 'Emmanuel Abiodun Oladipo',
    role: 'Founder & CTO',
    bio: 'Developer and frontend instructor based in Ilorin.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-xl font-semibold text-ink">Vendari</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-ink px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full border border-blue/20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">The story behind Vendari</p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-tight sm:text-6xl">Built from seeing the gap up close.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">Vendari exists to help small businesses understand and run the work they already do.</p>
        </div>
      </section>

      <article className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Why it started</p><h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">A product shaped by real conversations.</h2></div>
          <div className="space-y-6 text-base leading-8 text-text-secondary sm:text-lg sm:leading-9">
            <p>Vendari started from something I kept seeing up close, not something I read in a report. Between freelancing as a developer and teaching frontend development in Ilorin, I was constantly around small business owners — shop owners, market vendors, service providers — who were running real, often profitable businesses entirely from memory, a notebook, and a phone full of WhatsApp chats. None of it talked to each other. Most of them genuinely couldn&apos;t tell you if last month was profitable — not because they weren&apos;t capable, but because nobody had built them something that actually explained their own numbers back to them.</p>
            <p>I built Vendari to close that gap — starting with the basics that were missing, and building toward AI that reads a business&apos;s real data every day and tells the owner, in plain language, what&apos;s working and what isn&apos;t. Vendari is growing into the full operating layer around a small business — automated WhatsApp-based sales logging, a storefront that turns a merchant&apos;s existing inventory into a live online store, and payments that settle directly into the business&apos;s own bank account, never Vendari&apos;s.</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue/20">Start a 5-day trial <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </article>

      <section className="border-y border-border bg-surface px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="team-heading">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">The team</p><h2 id="team-heading" className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">The person building Vendari.</h2><p className="mt-5 text-base leading-7 text-text-secondary">Vendari is currently being built by a small, focused team. There is one founder profile here today; this layout is ready to grow as the team does.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{team.map((member) => <article key={member.name} className="rounded-xl border border-border bg-bg p-6 shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-gradient font-display text-2xl font-bold text-white">EA</div><h3 className="mt-6 font-display text-xl font-semibold text-ink">{member.name}</h3><p className="mt-2 text-sm font-semibold text-blue">{member.role}</p><p className="mt-4 text-sm leading-6 text-text-secondary">{member.bio}</p></article>)}</div></div>
      </section>

      <section className="bg-bg px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="today-heading">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Where we are today</p><h2 id="today-heading" className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">Early access, with the work already underway.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">Vendari is in active early access, onboarding its first businesses and learning directly from the people using it. The product is growing in public, with the core work focused on making everyday business operations clearer.</p></div><div className="rounded-xl border border-blue/20 bg-surface p-6 shadow-sm"><p className="text-sm font-semibold text-ink">Talk to the team</p><a href="tel:09016615446" className="mt-4 flex items-center gap-3 text-lg font-semibold text-blue hover:underline"><Phone className="h-5 w-5" />0901 661 5446</a><div className="mt-5 flex gap-3"><a href="https://www.tiktok.com/@vendari_ng?_r=1&_t=ZS-99dm8ICiMdT" target="_blank" rel="noreferrer" aria-label="Vendari on TikTok" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-secondary hover:border-blue hover:text-blue"><Music2 className="h-4 w-4" /></a><a href="https://x.com/vendarihq?s=11" target="_blank" rel="noreferrer" aria-label="Vendari on X" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-secondary hover:border-blue hover:text-blue"><AtSign className="h-4 w-4" /></a></div></div></div>
      </section>

      <footer className="border-t border-border bg-ink px-5 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-white/60"><span>© 2026 Vendari</span><nav className="flex gap-4"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/" className="hover:text-white">Home</Link></nav></div></footer>
    </main>
  )
}
