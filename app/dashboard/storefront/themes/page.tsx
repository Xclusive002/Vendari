'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ExternalLink, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getBusiness, getStorefrontSettings, updateStorefrontSettings } from '@/app/actions/business'
import { PageSkeleton } from '@/components/ui/skeleton'
import { StorefrontThemePreview } from '@/components/dashboard/storefront-theme-preview'
import { STOREFRONT_THEMES } from '@/lib/storefront-themes'

export default function StorefrontThemesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [selected, setSelected] = useState('classic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const current = await getBusiness()
      if (!current) { setLoading(false); return }
      setBusiness(current)
      const result = await getStorefrontSettings(current.id)
      if (result.success && result.data) setSelected(result.data.theme || 'classic')
      setLoading(false)
    }
    load()
  }, [])

  async function chooseTheme(key: string) {
    if (!business || saving) return
    setSelected(key)
    setSaving(true)
    const result = await updateStorefrontSettings(business.id, { theme: key })
    setSaving(false)
    if (result.success) toast.success('Theme applied to your storefront')
    else toast.error(result.error || 'Unable to apply theme')
  }

  if (loading) return <PageSkeleton rows={8} />
  if (!business) return <main className="dashboard-page"><div className="mx-auto max-w-6xl rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">Set up a business to choose a storefront theme.</div></main>

  return <main className="dashboard-page md:pl-8"><div className="mx-auto max-w-6xl space-y-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/dashboard/storefront" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline"><ArrowLeft className="h-4 w-4" /> Back to storefront</Link><p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront studio</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Choose your visual world</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">Every theme is mobile-first, built for real business content, and uses your own colors. Pick a direction now and refine it later.</p></div><Link href={business.storefront_slug ? `/s/${business.storefront_slug}` : '/dashboard/storefront'} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">Preview storefront <ExternalLink className="h-4 w-4" /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{STOREFRONT_THEMES.map((theme) => { const active = selected === theme.key; return <article key={theme.key} className={`overflow-hidden rounded-2xl border bg-surface shadow-sm transition ${active ? 'border-blue ring-2 ring-blue/20' : 'border-border hover:-translate-y-1 hover:shadow-lg'}`}><StorefrontThemePreview themeKey={theme.key} businessName={business.name || 'Your business'} /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-ink">{theme.label}</h2><p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">{theme.mood}</p></div>{active && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue"><Check className="h-4 w-4" /></span>}</div><p className="mt-3 min-h-10 text-sm leading-5 text-text-secondary">{theme.description}</p><Button onClick={() => chooseTheme(theme.key)} disabled={saving} variant={active ? 'outline' : 'default'} className={`mt-5 w-full ${active ? 'border-blue text-blue' : 'bg-brand-gradient text-white'}`}>{active ? 'Current theme' : saving ? 'Applying…' : 'Use this theme'}</Button></div></article> })}</div><div className="rounded-2xl border border-blue/15 bg-blue/5 p-5 text-sm leading-6 text-text-secondary"><Palette className="mr-2 inline h-4 w-4 text-blue" />Try a theme to apply it immediately, then fine-tune colors, story, and product layout in the <Link href="/dashboard/storefront/customize" className="font-semibold text-blue underline">design studio</Link>.</div></div></main>
}
