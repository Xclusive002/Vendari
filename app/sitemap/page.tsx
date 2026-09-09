import Link from 'next/link'

const sitemapLinks = [
  { label: 'Homepage', href: 'https://www.vendari.name.ng' },
  { label: 'Pricing', href: 'https://www.vendari.name.ng/pricing' },
  { label: 'Login', href: 'https://www.vendari.name.ng/login' },
  { label: 'Register', href: 'https://www.vendari.name.ng/register' },
]

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-14 text-text-primary">
      <section className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Vendari Sitemap</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink">Public pages</h1>
        <div className="mt-8 grid gap-3">
          {sitemapLinks.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink transition hover:bg-bg">
              <span>{item.label}</span>
              <span className="text-text-muted">↗</span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm leading-6 text-text-secondary">
          Search engines can also use the XML sitemap at <a className="text-blue underline" href="https://www.vendari.name.ng/sitemap.xml">https://www.vendari.name.ng/sitemap.xml</a>.
        </p>
      </section>
    </main>
  )
}
