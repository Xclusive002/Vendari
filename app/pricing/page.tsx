import Link from 'next/link'
import { ArrowRight, Check, Headphones, Sparkles, Users } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    audience: 'For a business getting organised',
    price: '₦0',
    cadence: 'forever',
    description: 'Build the daily habit of recording sales, stock, customers, and expenses in one dependable place.',
    features: ['Sales and inventory tracking', 'Customer and expense records', 'Basic dashboard overview', 'Simple receipts', 'No card required'],
    action: 'Start for free',
    href: '/register',
    featured: false,
  },
  {
    name: 'Pro',
    audience: 'For businesses ready to make better decisions',
    price: '₦9,500',
    cadence: 'per month',
    description: 'Use your business data to understand what changed, what needs attention, and what to do next.',
    features: ['Everything in Free', 'AI business insights and Ask Vendari', 'Voice sales and inventory entry', 'Advanced reports and forecasting', 'AI invoice drafting', 'Online invoice payment links', 'Team access for growing work'],
    action: 'Choose Pro',
    href: '/register',
    featured: true,
  },
  {
    name: 'Growth',
    audience: 'For teams and growing operations',
    price: '₦25,000',
    cadence: 'per month',
    description: 'Give your team shared visibility and give the owner stronger control across people, products, and performance.',
    features: ['Everything in Pro', 'More staff and accountant access', 'Owner-controlled team management', 'Higher AI and voice capacity', 'Advanced payment and operational visibility', 'Priority support'],
    action: 'Choose Growth',
    href: '/register',
    featured: false,
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <nav className="border-b border-border bg-surface/95" aria-label="Pricing navigation">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-xl font-bold text-ink">Vendari</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-bg sm:inline-flex">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white">Start free <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-border bg-surface px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Simple pricing for real businesses</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">Start small. Get clearer. Grow with confidence.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">Every plan gives you a dependable place to run the work. Paid plans add the intelligence, automation, and team control that become more valuable as your business grows.</p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-xl border p-6 shadow-sm sm:p-7 ${plan.featured ? 'border-blue bg-surface shadow-xl shadow-blue/10 ring-2 ring-blue/20' : 'border-border bg-surface'}`}>
              {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue">Most useful</span>}
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">{plan.name}</p>
              <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{plan.audience}</h2>
              <div className="mt-6 flex items-baseline gap-2"><span className="font-mono text-3xl font-semibold text-ink">{plan.price}</span><span className="text-sm text-text-muted">{plan.cadence}</span></div>
              <p className="mt-5 min-h-[84px] text-sm leading-6 text-text-secondary">{plan.description}</p>
              <Link href={plan.href} className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${plan.featured ? 'bg-brand-gradient text-white' : 'border border-ink text-ink'}`}>{plan.action} <ArrowRight className="h-4 w-4" /></Link>
              <div className="mt-7 border-t border-border pt-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Includes</p><ul className="mt-4 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-5 text-text-secondary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />{feature}</li>)}</ul></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-ink px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Vendari Concierge</p><h2 className="mt-4 font-display text-3xl font-semibold sm:text-5xl">Need someone to help execute the growth work?</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Concierge is a managed service for businesses that want more than software. A dedicated growth officer can help with your website, Google presence, campaign setup, and promotion decisions using the business data Vendari already understands.</p><p className="mt-5 text-sm font-medium text-white/80">Setup packages typically start around ₦50,000. Ongoing management is scoped around your business.</p><Link href="/dashboard/concierge" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white">Explore Concierge <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Sparkles className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Software plus insight</p><p className="mt-2 text-sm leading-6 text-white/60">Your recommendations come from your own sales and customer patterns.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Users className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Built for teams</p><p className="mt-2 text-sm leading-6 text-white/60">Bring operators and owners into one shared view of the work.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-5"><Headphones className="h-5 w-5 text-blue" /><p className="mt-4 font-display text-lg font-semibold">Human support</p><p className="mt-2 text-sm leading-6 text-white/60">Get practical help when the business needs execution, not another setting.</p></div></div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-3xl"><h2 className="font-display text-3xl font-semibold text-ink">What happens when you upgrade?</h2><div className="mt-8 grid gap-6 sm:grid-cols-3"><div><p className="font-mono text-sm text-blue">01</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">Your records stay</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Your sales, customers, inventory, and expenses remain in place.</p></div><div><p className="font-mono text-sm text-blue">02</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">More context unlocks</h3><p className="mt-2 text-sm leading-6 text-text-secondary">AI, forecasting, advanced reports, and payment tools use the data you already have.</p></div><div><p className="font-mono text-sm text-blue">03</p><h3 className="mt-3 font-display text-lg font-semibold text-ink">Your work gets clearer</h3><p className="mt-2 text-sm leading-6 text-text-secondary">The goal is fewer missed sales, fewer stock surprises, and better decisions.</p></div></div></div></section>

      <footer className="bg-ink px-5 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs text-white/50"><Link href="/" className="font-display text-lg font-semibold text-white">Vendari</Link><span>Business operations, with less guesswork.</span><span>© 2026 Vendari</span></div></footer>
    </main>
  )
}
