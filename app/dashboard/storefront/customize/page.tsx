'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, LayoutTemplate, Palette, Save, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/skeleton'
import { getBusiness, getStorefrontSettings, updateStorefrontSettings } from '@/app/actions/business'
import { STOREFRONT_THEMES } from '@/lib/storefront-themes'
import { StorefrontThemePreview } from '@/components/dashboard/storefront-theme-preview'

const VENDARI_BLUE = '#4683EC'

type Settings = Record<string, any>

export default function StorefrontCustomizePage() {
  const [business, setBusiness] = useState<any>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const current = await getBusiness()
      if (!current) { setLoading(false); return }
      setBusiness(current)
      const result = await getStorefrontSettings(current.id)
      if (result.success) setSettings(result.data)
      else toast.error(result.error || 'Unable to load storefront settings')
      setLoading(false)
    }
    load()
  }, [])

  const theme = useMemo(() => STOREFRONT_THEMES.find((item) => item.key === settings?.theme) || STOREFRONT_THEMES[0], [settings?.theme])
  const update = (key: string, value: any) => setSettings((current) => current ? { ...current, [key]: value } : current)

  async function save() {
    if (!business || !settings) return
    setSaving(true)
    const result = await updateStorefrontSettings(business.id, {
      description: settings.description || '',
      about: settings.about || '',
      storefront_label: settings.storefront_label || '',
      theme: settings.theme || 'classic',
      primary_color: settings.primary_color || VENDARI_BLUE,
      accent_color: settings.accent_color || theme.accent,
      product_display_mode: settings.product_display_mode || 'flexed',
    })
    setSaving(false)
    if (result.success && result.data) { setSettings(result.data); toast.success('Storefront design saved') }
    else if (result.success === false) toast.error(result.error || 'Unable to save storefront design')
  }

  if (loading) return <PageSkeleton rows={8} />
  if (!business || !settings) return <main className="dashboard-page"><div className="mx-auto max-w-6xl rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">Launch a storefront before opening the design studio.</div></main>

  return <main className="dashboard-page">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><Link href="/dashboard/storefront" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">Back to storefront</Link><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront studio</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-5xl">Make it unmistakably yours.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">Choose a visual direction, tune the details, and see the customer experience update as you work.</p></div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start"><Link href={settings.slug ? `/s/${settings.slug}` : '/dashboard/storefront'} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink px-4 py-2.5 text-sm font-semibold text-ink"><ExternalLink className="h-4 w-4" /> Preview live store</Link><Button onClick={save} disabled={saving} className="min-h-11 bg-brand-gradient text-white"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save design'}</Button></div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="order-2 space-y-6 xl:order-1">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Visual direction</h2><p className="text-sm text-text-secondary">Choose a complete storefront look, not just a color palette.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{STOREFRONT_THEMES.map((preset) => { const active = settings.theme === preset.key; return <button type="button" key={preset.key} onClick={() => update('theme', preset.key)} aria-pressed={active} className={`group relative overflow-hidden rounded-2xl border text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl ${active ? 'border-blue ring-2 ring-blue/25' : 'border-border'}`}><StorefrontThemePreview themeKey={preset.key} businessName={business.name || 'Your business'} description={settings.description} primaryColor={settings.primary_color} accentColor={settings.accent_color} className="border-0 shadow-none" />{active && <span className="absolute right-3 top-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue shadow-lg"><Check className="h-4 w-4" /></span>}<div className="border-t border-border bg-surface p-4"><div className="flex items-center justify-between gap-2"><p className="font-display text-base font-semibold text-ink">{preset.label}</p><span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{preset.mood}</span></div><p className="mt-1 text-xs leading-5 text-text-secondary">{preset.description}</p></div></button> })}</div></div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Content and layout</h2><p className="text-sm text-text-secondary">Shape what customers see before they browse.</p></div></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium text-text-secondary">Storefront headline<textarea value={settings.description || ''} onChange={(event) => update('description', event.target.value)} className="dashboard-input mt-2 min-h-24 w-full px-3 py-2 text-sm" placeholder="What should customers know first?" /></label><label className="block text-sm font-medium text-text-secondary">About your business<textarea value={settings.about || ''} onChange={(event) => update('about', event.target.value)} className="dashboard-input mt-2 min-h-32 w-full px-3 py-2 text-sm" placeholder="Tell your story in a few clear lines." /></label><label className="block text-sm font-medium text-text-secondary">Product presentation<select value={settings.product_display_mode || 'flexed'} onChange={(event) => update('product_display_mode', event.target.value)} className="dashboard-input mt-2 min-h-11 w-full px-3 py-2 text-sm"><option value="flexed">Grid - browse several products at once</option><option value="block">Editorial list - one product at a time</option></select></label></div></div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Brand controls</h2><p className="text-sm text-text-secondary">Keep the structure of a theme while making the color language yours.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{([['primary_color', 'Primary color'], ['accent_color', 'Accent color']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3"><input type="color" value={settings[key] || (key === 'primary_color' ? VENDARI_BLUE : theme.accent)} onChange={(event) => update(key, event.target.value)} className="h-11 w-12 cursor-pointer rounded border-0 bg-transparent p-0" /><span><span className="block text-sm font-semibold text-ink">{label}</span><span className="text-xs uppercase text-text-muted">{settings[key] || theme[key === 'primary_color' ? 'primary' : 'accent']}</span></span></label>)}</div><label className="mt-4 block text-sm font-medium text-text-secondary">Custom storefront label<Input value={settings.storefront_label || ''} onChange={(event) => update('storefront_label', event.target.value)} className="mt-2" placeholder="e.g. Made for everyday living" /></label></div>
        </section>

        <aside className="order-1 h-fit xl:sticky xl:top-24 xl:order-2"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Live canvas</p><p className="mt-1 text-sm text-text-secondary">A customer-facing preview</p></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">LIVE PREVIEW</span></div><StorefrontThemePreview themeKey={settings.theme || 'classic'} businessName={business.name || 'Your business'} description={settings.description} primaryColor={settings.primary_color} accentColor={settings.accent_color} /><div className="mt-3 rounded-xl border border-blue/15 bg-blue/5 p-4 text-sm text-text-secondary"><Wand2 className="mr-2 inline h-4 w-4 text-blue" />Your preview responds as you switch themes, tune your colors, or refine your storefront headline.</div></aside>
      </div>
    </div>
  </main>
}
