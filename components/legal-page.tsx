import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

type LegalSection = {
  heading: string
  paragraphs: string[]
}

type LegalPageProps = {
  title: string
  description: string
  lastUpdated: string
  intro: string
  sections: LegalSection[]
}

export function LegalPage({ title, description, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-xl font-semibold text-ink">Vendari</Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            <ShieldCheck className="h-4 w-4" /> Vendari legal
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-text-secondary">{description}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">Last updated {lastUpdated}</p>
        </div>

        <div className="mt-14 max-w-3xl space-y-10">
          <p className="text-base leading-8 text-text-secondary">{intro}</p>
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-semibold text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-4 text-base leading-8 text-text-secondary">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className="border-t border-border bg-ink px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Vendari. Business operations, with less guesswork.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal navigation">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/dmca" className="hover:text-white">DMCA</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
