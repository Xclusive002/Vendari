'use client'

import Link from 'next/link'
import { ArrowRight, Check, Clock3, Globe2, MapPin, Megaphone, MessageCircle, UserRound } from 'lucide-react'

const included = [
  {
    icon: Globe2,
    title: 'A custom-built, SEO-optimized website',
    description: 'Not a template with your name swapped in — a real site built around what your business actually sells, structured so it shows up when people search for what you offer. Your Vendari growth officer designs it, writes the content, and gets it live.',
    timeline: 'Live within 10–15 business days of kickoff.',
    get: ['A real, owned domain and hosting in your name.', 'A site that loads fast and reads well on a phone.', 'Copy written around your actual products and location, not generic filler.'],
  },
  {
    icon: MapPin,
    title: 'Google Business Profile setup and optimization',
    description: 'Your business, correctly listed and easy to find the moment someone searches nearby — categories, hours, photos, service area, and posts, all set up properly from day one.',
    timeline: "Listing live and optimized within 5–7 business days — final verification timing depends on Google's own review process.",
    get: ['A fully completed profile, not the bare minimum.', 'A posting cadence your officer manages on your behalf.', 'Guidance on collecting the reviews that actually move you up in local search.'],
  },
  {
    icon: Megaphone,
    title: 'Meta and TikTok ad campaigns, set up and run for you',
    description: 'Your growth officer builds the ad creative, sets the targeting, and manages the campaign directly inside your own ad account — so the budget, the data, and the account stay yours.',
    timeline: 'First campaign live within 2 weeks of kickoff, with ongoing adjustments monthly.',
    get: ['Ad creative and copy built around what is actually selling in your Vendari data.', 'A campaign your officer actively manages rather than sets and forgets.', 'A monthly summary of what worked.'],
  },
]

const steps = [
  'You are matched with a dedicated Vendari growth officer — one person, not a rotating support queue, reachable directly on WhatsApp.',
  'A short kickoff conversation to understand your business, what you sell, and who your customers are.',
  'Your officer builds and sets up your website, Google listing, and first ad campaign on the timelines above.',
  'Ongoing management — monthly check-ins, ad adjustments, and a direct line for anything related to these three areas.',
]

export function ConciergeCTA() {
  return (
    <div className="mt-12 flex flex-col items-start gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-ink">Talk to us about Concierge</p>
        <p className="mt-1 text-sm text-text-secondary">No commitment — we&apos;ll walk through what your business needs first.</p>
      </div>
      <Link href="/concierge-inquiry" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue/20">
        Talk to us about Concierge <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export function ConciergeSections() {
  return (
    <>
      <section className="mt-14" aria-labelledby="concierge-included">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">What&apos;s included</p><h2 id="concierge-included" className="mt-3 font-display text-3xl font-semibold text-ink">Three things, handled properly.</h2></div><MessageCircle className="hidden h-6 w-6 text-blue sm:block" /></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {included.map(({ icon: Icon, title, description, timeline, get }) => (
            <article key={title} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <Icon className="h-6 w-6 text-blue" />
              <h3 className="mt-8 font-display text-xl font-semibold leading-tight text-ink">{title}</h3>
              <p className="mt-4 text-sm leading-6 text-text-secondary">{description}</p>
              <p className="mt-5 flex gap-2 border-t border-border pt-4 text-xs font-semibold leading-5 text-ink"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-blue" />{timeline}</p>
              <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">What you get</p><ul className="mt-3 space-y-2">{get.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-text-secondary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />{item}</li>)}</ul></div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-16 border-t border-border pt-12" aria-labelledby="concierge-process">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">How it works</p><h2 id="concierge-process" className="mt-3 font-display text-3xl font-semibold text-ink">A real person, from kickoff to ongoing management.</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">{steps.map((step, index) => <li key={step} className="rounded-xl border border-border bg-bg p-5"><span className="font-mono text-sm text-blue">0{index + 1}</span><p className="mt-6 text-sm leading-6 text-text-secondary">{step}</p></li>)}</ol>
        <p className="mt-7 max-w-3xl text-sm leading-6 text-text-secondary">Vendari Concierge covers your website, Google Business Profile, and ad campaigns — your officer&apos;s full focus is making sure these three things work for you, not general tech support for unrelated tools or hardware.</p>
        <ConciergeCTA />
      </section>
    </>
  )
}

export function ConciergeOverview() {
  return (
    <section className="border-t border-border bg-surface px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="concierge-heading">
      <div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">VENDARI CONCIERGE</p><h2 id="concierge-heading" className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">Your business, seen. Handled by a real person.</h2><p className="mt-6 text-lg leading-8 text-text-secondary">Running the shop is enough work on its own. Vendari Concierge gives you a dedicated growth officer who builds your website, sets up your Google listing, and runs your ads — so being found online stops being one more thing on your list.</p><p className="mt-6 text-base leading-7 text-text-secondary">Most businesses know they should have a proper website, show up on Google when someone searches nearby, and run ads that actually bring customers in. Almost none of them have the time to figure out how. Vendari Concierge is a dedicated technical officer assigned to your business — reachable directly on WhatsApp — who does this work for you, on accounts you own, so you&apos;re never locked into anything.</p></div><ConciergeSections /></div>
    </section>
  )
}

export function ConciergeDetail() {
  return <><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">VENDARI CONCIERGE</p><h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">Grow beyond the dashboard.</h1><p className="mt-6 text-lg leading-8 text-text-secondary">You&apos;ve already got the numbers — Vendari Concierge turns them into a website, a Google presence, and ads that bring customers in, run by a real person who knows your business, not a support ticket queue.</p></div><ConciergeSections /></>
}
