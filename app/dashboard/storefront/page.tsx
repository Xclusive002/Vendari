'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Copy, ExternalLink, Globe, ImagePlus, KeyRound, Rocket, Store, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { checkStorefrontSlug, getBusiness, getStorefrontSettings, launchStorefront, updateStorefrontSettings } from '@/app/actions/business'
import { getStorefrontUrl } from '@/lib/storefront'

const VENDARI_BLUE = '#4683EC'

export default function StorefrontPage() {
  const [business, setBusiness] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; message: string } | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  useEffect(() => {
    async function load() {
      const current = await getBusiness()
      if (!current) {
        setLoading(false)
        return
      }
      setBusiness(current)
      const storefront = await getStorefrontSettings(current.id)
      if (storefront.success && storefront.data) {
        setSettings(storefront.data)
        setSlugDraft(storefront.data.slug || '')
      }
      setLoading(false)
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
    return getStorefrontUrl(settings.slug)
  }, [settings])

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

  if (loading) return <div className="dashboard-page"><div className="mx-auto max-w-5xl rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">Loading storefront…</div></div>

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
          <Button onClick={() => setSettings({ ...settings, is_published: !settings.is_published })} className={settings.is_published ? 'bg-emerald-600 text-white' : 'bg-brand-gradient text-white'}>
            {settings.is_published ? 'Published' : 'Publish storefront'}
          </Button>
        </div>

        <Link href="/dashboard/storefront/products" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">
          Manage storefront products <ExternalLink className="h-4 w-4" />
        </Link>

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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Live preview</p>
                <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white"><Store className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold text-ink">{business.name}</p>
                      <p className="text-xs text-text-muted">{settings.description || 'Fresh products and services for your customers.'}</p>
                    </div>
                  </div>
                </div>
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
                <textarea value={settings.description || ''} onChange={(e) => setSettings({ ...settings, description: e.target.value })} className="mt-2 min-h-28 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">WhatsApp number</label>
                <Input value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} className="mt-2" />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary">Delivery option</label>
                <select value={settings.delivery_option || 'both'} onChange={(e) => setSettings({ ...settings, delivery_option: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
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
