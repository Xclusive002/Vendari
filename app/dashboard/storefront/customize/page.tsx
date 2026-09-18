'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, LayoutTemplate, Palette, Save, Sparkles, Store, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/skeleton'
import { getBusiness, getStorefrontSettings, updateStorefrontSettings } from '@/app/actions/business'
import { STOREFRONT_THEMES } from '@/lib/storefront-themes'

const VENDARI_BLUE = '#4683EC'

type Settings = Record<string, any>

function ThemeCanvas({ business, settings }: { business: any; settings: Settings }) {
  const theme = STOREFRONT_THEMES.find((item) => item.key === settings.theme) || STOREFRONT_THEMES[0]
  const primary = settings.primary_color || theme.primary
  const accent = settings.accent_color || theme.accent
  const dark = theme.key === 'noir'
  const editorial = theme.key === 'editorial' || theme.key === 'atelier'
  const bold = theme.key === 'bold' || theme.key === 'sunset'
  const products = ['Featured product', 'New arrival', 'Best seller']

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-modal)]" style={{ backgroundColor: theme.surface, color: theme.ink }}>
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 text-xs" style={{ backgroundColor: dark ? '#111827' : primary, color: '#fff' }}>
        <div className="flex items-center gap-2 font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">{business?.name?.slice(0, 1) || 'V'}</span>{business?.name || 'Your storefront'}</div>
        <span className="hidden uppercase tracking-[0.16em] text-white/70 sm:inline">{theme.label}</span>
      </div>
      <div className="p-4 sm:p-6">
        <div className={`${bold ? 'min-h-36 rounded-2xl p-5 text-white' : editorial ? 'border-b-2 border-current pb-5' : 'rounded-xl border border-black/10 p-4'}`} style={bold ? { background: `linear-gradient(135deg, ${primary}, ${accent})` } : undefined}>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${bold ? 'text-white/70' : ''}`} style={!bold ? { color: accent } : undefined}>Online shop</p>
          <h2 className={`mt-2 font-display font-bold ${bold ? 'text-3xl' : editorial ? 'text-3xl italic' : 'text-2xl'}`}>{business?.name || 'Your business'}</h2>
          <p className={`mt-2 max-w-lg text-sm leading-6 ${bold ? 'text-white/80' : 'opacity-65'}`}>{settings.description || 'A storefront shaped around your business.'}</p>
        </div>
        <div className={`mt-5 grid gap-3 ${settings.product_display_mode === 'block' ? 'sm:grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {products.map((product, index) => <div key={product} className={`overflow-hidden border border-black/10 bg-white/80 ${bold ? 'rounded-2xl' : theme.key === 'minimal' ? 'rounded-none' : 'rounded-xl'}`}><div className="h-20" style={{ background: index === 1 ? accent : `${primary}30` }} /><div className="p-3"><p className="truncate text-xs font-semibold">{product}</p><p className="mt-1 text-xs font-bold" style={{ color: accent }}>N2,500</p></div></div>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-semibold text-white" style={{ backgroundColor: dark ? '#111827' : primary }}><span>Designed for your customers</span><span className="rounded-full bg-white/20 px-3 py-1">Shop now</span></div>
      </div>
    </div>
  )
}

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
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Visual direction</h2><p className="text-sm text-text-secondary">Every theme changes rhythm, contrast, shape, and hierarchy.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{STOREFRONT_THEMES.map((preset) => { const active = settings.theme === preset.key; return <button type="button" key={preset.key} onClick={() => update('theme', preset.key)} className={`overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] ${active ? 'border-blue ring-2 ring-blue/20' : 'border-border'}`}><div className={`relative h-28 ${preset.preview}`}><div className="absolute inset-3 rounded-lg border border-white/30 bg-white/15 p-3 text-white backdrop-blur-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-bold">{business.name || 'Your business'}</span><span className="text-[8px] uppercase tracking-widest text-white/70">{preset.label}</span></div><div className="mt-5 h-1.5 w-2/3 rounded-full bg-white/80" /><div className="mt-2 h-1.5 w-1/2 rounded-full bg-white/40" /></div>{active && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue"><Check className="h-4 w-4" /></span>}</div><div className="bg-surface p-3"><p className="font-display text-base font-semibold text-ink">{preset.label}</p><p className="mt-1 text-xs text-text-muted">{preset.mood}</p></div></button> })}</div></div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Content and layout</h2><p className="text-sm text-text-secondary">Shape what customers see before they browse.</p></div></div><div className="mt-5 space-y-4"><label className="block text-sm font-medium text-text-secondary">Storefront headline<textarea value={settings.description || ''} onChange={(event) => update('description', event.target.value)} className="dashboard-input mt-2 min-h-24 w-full px-3 py-2 text-sm" placeholder="What should customers know first?" /></label><label className="block text-sm font-medium text-text-secondary">About your business<textarea value={settings.about || ''} onChange={(event) => update('about', event.target.value)} className="dashboard-input mt-2 min-h-32 w-full px-3 py-2 text-sm" placeholder="Tell your story in a few clear lines." /></label><label className="block text-sm font-medium text-text-secondary">Product presentation<select value={settings.product_display_mode || 'flexed'} onChange={(event) => update('product_display_mode', event.target.value)} className="dashboard-input mt-2 min-h-11 w-full px-3 py-2 text-sm"><option value="flexed">Grid - browse several products at once</option><option value="block">Editorial list - one product at a time</option></select></label></div></div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue" /><div><h2 className="font-display text-xl font-semibold text-ink">Brand controls</h2><p className="text-sm text-text-secondary">Keep the structure of a theme while making the color language yours.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{([['primary_color', 'Primary color'], ['accent_color', 'Accent color']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3"><input type="color" value={settings[key] || (key === 'primary_color' ? VENDARI_BLUE : theme.accent)} onChange={(event) => update(key, event.target.value)} className="h-11 w-12 cursor-pointer rounded border-0 bg-transparent p-0" /><span><span className="block text-sm font-semibold text-ink">{label}</span><span className="text-xs uppercase text-text-muted">{settings[key] || theme[key === 'primary_color' ? 'primary' : 'accent']}</span></span></label>)}</div><label className="mt-4 block text-sm font-medium text-text-secondary">Custom storefront label<Input value={settings.storefront_label || ''} onChange={(event) => update('storefront_label', event.target.value)} className="mt-2" placeholder="e.g. Made for everyday living" /></label></div>
        </section>

        <aside className="order-1 h-fit xl:sticky xl:top-24 xl:order-2"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Live canvas</p><p className="mt-1 text-sm text-text-secondary">A customer-facing preview</p></div><Store className="h-5 w-5 text-blue" /></div><ThemeCanvas business={business} settings={settings} /><div className="mt-3 rounded-xl border border-blue/15 bg-blue/5 p-4 text-sm text-text-secondary"><Wand2 className="mr-2 inline h-4 w-4 text-blue" />Theme changes are intentionally different: a bold market, an editorial studio, and a minimal shop should not feel like the same storefront wearing new colors.</div></aside>
      </div>
    </div>
  </main>
}
