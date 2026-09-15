'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Copy, ExternalLink, Facebook, Globe, ImagePlus, Instagram, KeyRound, Music2, Rocket, Store, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { checkStorefrontSlug, getBusiness, getStorefrontSettings, launchStorefront, updateBusiness, updateStorefrontSettings, uploadStorefrontBanner } from '@/app/actions/business'
import { getStorefrontUrl } from '@/lib/storefront'
import { PageSkeleton } from '@/components/ui/skeleton'

const VENDARI_BLUE = '#4683EC'
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'tiktok', label: 'TikTok', icon: Music2 },
  { key: 'twitter', label: 'Twitter/X', icon: Globe },
] as const
const THEME_PRESETS = [
  { key: 'classic', label: 'Classic', description: 'Warm, balanced shop layout', accent: '#4683EC', surface: '#F8FAFC', radius: 'rounded-lg' },
  { key: 'bold', label: 'Bold', description: 'High-contrast, expressive storefront', accent: '#F97316', surface: '#FFF7ED', radius: 'rounded-2xl' },
  { key: 'minimal', label: 'Minimal', description: 'Quiet, clean product-first layout', accent: '#111827', surface: '#FFFFFF', radius: 'rounded-none' },
] as const

function StorefrontPreview({ business, settings }: { business: any; settings: any }) {
  const primary = settings.primary_color || '#4683EC'
  const accent = settings.accent_color || primary
  const theme = THEME_PRESETS.find((preset) => preset.key === settings.theme) || THEME_PRESETS[0]
  const isBold = theme.key === 'bold'
  const isMinimal = theme.key === 'minimal'
  return (
    <div className={`overflow-hidden border border-border bg-white shadow-sm ${theme.radius}`}>
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{business.name?.slice(0, 1) || 'S'}</span><span className="text-xs font-semibold">{business.name || 'Your store'}</span></div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/70">{theme.label}</span>
      </div>
      <div className="p-4" style={{ backgroundColor: theme.surface }}>
        <div className={`${isBold ? 'min-h-24 rounded-xl p-4 text-white' : isMinimal ? 'border-b border-slate-200 pb-4' : 'rounded-lg p-3'} ${isBold ? 'flex flex-col justify-end' : ''}`} style={isBold ? { backgroundColor: primary } : undefined}>
          <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${isBold ? 'text-white/70' : 'text-slate-500'}`}>Online shop</p>
          <p className={`mt-1 font-bold ${isBold ? 'text-xl' : 'text-lg'}`} style={!isBold ? { color: primary } : undefined}>{business.name || 'Your storefront'}</p>
          <p className={`mt-1 line-clamp-1 text-[10px] ${isBold ? 'text-white/80' : 'text-slate-500'}`}>{settings.description || 'Fresh products and services for your customers.'}</p>
        </div>
        <div className={`mt-4 grid grid-cols-3 gap-2 ${isMinimal ? '' : 'rounded-lg'}`}>
          {['Product one', 'Product two', 'Product three'].map((product, index) => <div key={product} className="overflow-hidden border border-slate-200 bg-white" style={{ borderRadius: isMinimal ? 0 : 8 }}><div className="h-14" style={{ backgroundColor: index === 1 ? accent : `${primary}22` }} /><div className="p-2"><p className="truncate text-[10px] font-semibold text-slate-800">{product}</p><p className="mt-1 text-[9px] font-bold" style={{ color: accent }}>N2,500</p></div></div>)}
        </div>
      </div>
    </div>
  )
}

export default function StorefrontPage() {
  const [business, setBusiness] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; message: string } | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState<'logo' | 'banner' | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const current = await getBusiness()
        if (!current) return
        setBusiness(current)
        const storefront = await getStorefrontSettings(current.id)
        if (!storefront.success) {
          setLoadError(storefront.error || 'Unable to load storefront settings.')
        } else if (storefront.data) {
          setSettings(storefront.data)
          setSlugDraft(storefront.data.slug || '')
        }
      } catch {
        setLoadError('Unable to load storefront settings. Try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!slugDraft) {
      setSlugStatus(null)
      return
    }
    const timeout = window.setTimeout(async () => {
      if (!business) return
      setCheckingSlug(true)
      const result = await checkStorefrontSlug(slugDraft)
      if (result.success) setSlugStatus({ available: !!result.data.available, message: result.data.message })
      else setSlugStatus({ available: false, message: result.error || 'Unable to check slug.' })
      setCheckingSlug(false)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [slugDraft, business])

  const storefrontUrl = useMemo(() => {
    if (!settings?.slug) return 'Storefront not launched yet'
    return getStorefrontUrl(settings.slug, true)
  }, [settings])

  const shareMessage = settings?.slug ? `Shop with us online 👉 ${storefrontUrl}` : ''

  const copyShareMessage = async () => {
    if (!shareMessage) return
    await navigator.clipboard.writeText(shareMessage)
    toast.success('Share message copied')
  }

  const handleLaunch = async () => {
    if (!business) return
    setLaunching(true)
    const result = await launchStorefront(business.id)
    setLaunching(false)
    if (result.success && result.data) {
      setSettings(result.data)
      setSlugDraft(result.data.slug)
      toast.success('Your storefront is live!')
    } else if (result.success === false) {
      toast.error(result.error || 'Unable to launch storefront')
    }
  }

  const handleSave = async () => {
    if (!business || !settings) return
    setSaving(true)
    const payload = {
      slug: slugDraft,
      description: settings.description || '',
      whatsapp_number: settings.whatsapp_number || '',
      delivery_option: settings.delivery_option || 'both',
      primary_color: settings.primary_color || VENDARI_BLUE,
      theme: settings.theme || 'classic',
      is_published: Boolean(settings.is_published),
      social_links: settings.social_links || {},
    }
    const result = await updateStorefrontSettings(business.id, payload)
    setSaving(false)
    if (result.success && result.data) {
      setSettings(result.data)
      toast.success('Storefront saved')
    } else if (result.success === false) {
      toast.error(result.error || 'Unable to save storefront details')
    }
  }

  const handlePublishToggle = async () => {
    if (!business || !settings) return
    setPublishing(true)
    const nextPublished = !settings.is_published
    const result = await updateStorefrontSettings(business.id, {
      is_published: nextPublished,
    })
    setPublishing(false)
    if (result.success && result.data) {
      setSettings(result.data)
      toast.success(nextPublished ? 'Storefront published' : 'Storefront unpublished')
    } else if (result.success === false) {
      toast.error(result.error || 'Unable to update storefront status')
    }
  }

  const handleMediaUpload = async (kind: 'logo' | 'banner', file: File | undefined) => {
    if (!business || !file) return
    setUploadingMedia(kind)
    const result = kind === 'logo'
      ? await updateBusiness(business.id, { logo: file })
      : await uploadStorefrontBanner(business.id, file)
    setUploadingMedia(null)
    if (result.success) {
      const refreshed = await getStorefrontSettings(business.id)
      if (refreshed.success) setSettings(refreshed.data)
      toast.success(`${kind === 'logo' ? 'Logo' : 'Banner'} updated`)
    } else {
      toast.error(result.error)
    }
  }

  if (loading) return <PageSkeleton rows={5} />

  if (loadError) return <div className="dashboard-page"><div className="mx-auto max-w-5xl rounded-xl border border-negative/20 bg-surface p-6 shadow-[var(--shadow-card)]" role="alert"><p className="font-semibold text-negative">We could not load your storefront.</p><p className="mt-2 text-sm text-text-secondary">{loadError}</p></div></div>

  if (!business) return <div className="dashboard-page"><div className="mx-auto max-w-5xl rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">Set up a business to launch your storefront.</div></div>

  if (!settings) {
    return (
      <div className="dashboard-page">
        <div className="mx-auto max-w-2xl rounded-xl border border-blue/20 bg-surface p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white"><Rocket className="h-5 w-5" /></div>
          <h1 className="font-display text-3xl font-semibold text-ink">Launch your storefront</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">Your storefront is not live yet. Launch it now to generate a unique storefront link and start selling online.</p>
          <Button onClick={handleLaunch} disabled={launching} className="mt-6 bg-brand-gradient text-white">
            {launching ? 'Launching…' : 'Launch storefront'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Your online shop</h1>
          </div>
          <Button onClick={handlePublishToggle} disabled={publishing} className={settings.is_published ? 'bg-emerald-600 text-white' : 'bg-brand-gradient text-white'}>
            {publishing ? 'Updating…' : settings.is_published ? 'Published' : 'Publish storefront'}
          </Button>
        </div>

        <Link href="/dashboard/storefront/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">
          Manage storefront products <ExternalLink className="h-4 w-4" />
        </Link>

        <div className="rounded-xl border border-blue/20 bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Storefront link</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href={storefrontUrl} target="_blank" rel="noreferrer" className="break-all text-sm font-semibold text-blue hover:underline">{storefrontUrl}</a>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(storefrontUrl).then(() => toast.success('Storefront link copied'))}>Copy</Button>
              <Button variant="outline" size="sm" onClick={copyShareMessage}>Share</Button>
              <a href={getStorefrontUrl(settings.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium">Preview</a>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">Share text: {shareMessage}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-ink">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Live link</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href={storefrontUrl} target="_blank" rel="noreferrer" className="truncate text-base font-semibold text-blue">{storefrontUrl}</a>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(storefrontUrl)} className="gap-2">
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Share message</p>
                <p className="mt-3 text-sm text-text-secondary">Hi! I just launched my storefront on Vendari. You can place orders here: {storefrontUrl}</p>
              </div>

              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Live preview</p><span className="text-[10px] font-semibold text-emerald-600">Updates instantly</span></div>
                <div className="mt-3"><StorefrontPreview business={business} settings={settings} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-ink">Customize</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Storefront slug</label>
                <Input value={slugDraft} onChange={(e) => setSlugDraft(e.target.value)} className="mt-2" />
                {slugDraft && (
                  <p className={`mt-2 flex items-center gap-2 text-xs ${slugStatus?.available ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {checkingSlug ? <Wand2 className="h-3.5 w-3.5 animate-spin" /> : slugStatus?.available ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {slugStatus?.message || 'Checking availability…'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">Description</label>
                <textarea value={settings.description || ''} onChange={(e) => setSettings({ ...settings, description: e.target.value })} className="dashboard-input mt-2 min-h-28 w-full px-3 py-2 text-sm" />
              </div>

              <div>
                <p className="text-sm font-medium text-text-secondary">Storefront theme</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {THEME_PRESETS.map((preset) => {
                    const selected = (settings.theme || 'classic') === preset.key
                    return <button key={preset.key} type="button" onClick={() => setSettings({ ...settings, theme: preset.key })} className={`text-left transition ${selected ? 'ring-2 ring-blue ring-offset-2' : 'hover:-translate-y-0.5'}`}>
                      <div className={`overflow-hidden rounded-lg border ${selected ? 'border-blue ring-2 ring-blue ring-offset-2' : 'border-border'}`}>
                        <div className="h-7" style={{ backgroundColor: preset.accent }} />
                        <div className="space-y-2 bg-white p-2"><div className="h-2 w-2/3 rounded-full bg-slate-200" /><div className="grid grid-cols-3 gap-1"><span className="h-8 rounded-sm bg-slate-100" /><span className="h-8 rounded-sm bg-slate-200" /><span className="h-8 rounded-sm bg-slate-100" /></div></div>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-ink">{preset.label}</p><p className="mt-0.5 text-[10px] leading-4 text-text-muted">{preset.description}</p>
                    </button>
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-text-secondary">Store colors</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([['primary_color', 'Primary color'], ['accent_color', 'Accent color']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-lg border border-border bg-bg p-3"><input type="color" value={settings[key] || VENDARI_BLUE} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0" /><span><span className="block text-xs font-semibold text-ink">{label}</span><span className="text-[11px] uppercase text-text-muted">{settings[key] || VENDARI_BLUE}</span></span></label>)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Store logo</label>
                  <Input type="file" accept="image/*" onChange={(event) => handleMediaUpload('logo', event.target.files?.[0])} disabled={uploadingMedia !== null} className="mt-2" />
                  {settings.logo && <img src={settings.logo} alt="Store logo" className="mt-3 h-14 w-14 rounded-lg object-cover" />}
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Store banner</label>
                  <Input type="file" accept="image/*" onChange={(event) => handleMediaUpload('banner', event.target.files?.[0])} disabled={uploadingMedia !== null} className="mt-2" />
                  {settings.banner_image && <img src={settings.banner_image} alt="Store banner" className="mt-3 h-14 w-full rounded-lg object-cover" />}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-text-secondary">Social Links</p>
                <p className="mt-1 text-xs text-text-muted">Add any profiles you want customers to find. Leave the rest blank.</p>
                <div className="mt-3 space-y-3">
                  {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="relative">
                      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <Input
                        type="url"
                        value={settings.social_links?.[key] || ''}
                        onChange={(event) => setSettings({ ...settings, social_links: { ...(settings.social_links || {}), [key]: event.target.value } })}
                        placeholder={`${label} URL (https://...)`}
                        className="pl-10"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">WhatsApp number</label>
                <Input value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} className="mt-2" />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">Delivery option</label>
                <select value={settings.delivery_option || 'both'} onChange={(e) => setSettings({ ...settings, delivery_option: e.target.value })} className="dashboard-input mt-2 min-h-11 w-full px-3 py-2 text-sm">
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-brand-gradient text-white">{saving ? 'Saving…' : 'Save storefront'}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
