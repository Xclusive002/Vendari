'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Edit2, ImagePlus, Plus, Scissors, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageSkeleton } from '@/components/ui/skeleton'
import { getBusiness, getServices, createService, updateService, deleteService, type ServiceRecord } from '@/app/actions/business'

const blank = { name: '', description: '', price: '', imageFile: null as File | null }

export default function StorefrontServicesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState<ServiceRecord | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    const current = await getBusiness()
    if (!current) return
    setBusiness(current)
    const result = await getServices(String(current.id))
    if (result.success) setServices(result.data)
    else toast.error(result.error)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openForm(service?: ServiceRecord) {
    setEditing(service || null)
    setForm(service ? { name: service.name, description: service.description || '', price: service.price == null ? '' : String(service.price), imageFile: null } : blank)
    setOpen(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!business || !form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description, price: form.price.trim() === '' ? null : form.price, imageFile: form.imageFile, is_visible_on_storefront: editing?.is_visible_on_storefront ?? true, display_order: editing?.display_order ?? services.length }
    const result = editing ? await updateService(String(business.id), editing.id, payload) : await createService(String(business.id), payload)
    setSaving(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success(editing ? 'Service updated' : 'Service added')
    setOpen(false)
    load()
  }

  async function remove(service: ServiceRecord) {
    if (!business || !window.confirm(`Delete ${service.name}?`)) return
    const result = await deleteService(String(business.id), service.id)
    if (result.success) { toast.success('Service deleted'); load() } else toast.error(result.error)
  }

  async function move(service: ServiceRecord, direction: -1 | 1) {
    if (!business) return
    const index = services.findIndex((item) => item.id === service.id)
    const target = services[index + direction]
    if (!target) return
    await Promise.all([
      updateService(String(business.id), service.id, { display_order: target.display_order }),
      updateService(String(business.id), target.id, { display_order: service.display_order }),
    ])
    load()
  }

  async function toggle(service: ServiceRecord) {
    if (!business) return
    const result = await updateService(String(business.id), service.id, { is_visible_on_storefront: !service.is_visible_on_storefront })
    if (result.success) setServices((items) => items.map((item) => item.id === service.id ? { ...item, is_visible_on_storefront: !item.is_visible_on_storefront } : item))
    else toast.error(result.error)
  }

  if (loading) return <PageSkeleton rows={4} />
  return <main className="mx-auto max-w-6xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">Services</h1><p className="mt-2 text-text-secondary">Offer appointments, consulting, repairs, and other work alongside products.</p></div>
      <Button onClick={() => openForm()} className="dashboard-primary"><Plus className="mr-2 h-4 w-4" />Add service</Button>
    </div>
    {services.length === 0 ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Scissors className="h-10 w-10 text-blue" /><h2 className="mt-4 font-display text-xl font-semibold text-ink">No services yet</h2><p className="mt-2 max-w-md text-sm text-text-secondary">Add your first service even if you have no inventory products. Leave the price blank when customers should contact you.</p><Button onClick={() => openForm()} className="dashboard-primary mt-5"><Plus className="mr-2 h-4 w-4" />Add your first service</Button></CardContent></Card> : <div className="space-y-3">{services.map((service, index) => <Card key={service.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg">{service.image ? <img src={service.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-text-muted" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-semibold text-ink">{service.name}</h2><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${service.is_visible_on_storefront ? 'bg-emerald-100 text-emerald-700' : 'bg-bg text-text-muted'}`}>{service.is_visible_on_storefront ? 'Visible' : 'Hidden'}</span></div><p className="mt-1 line-clamp-2 text-sm text-text-secondary">{service.description || 'No description added.'}</p><p className="mt-2 text-sm font-semibold text-blue">{service.price == null ? 'Contact for pricing' : `N${Number(service.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => move(service, -1)} disabled={index === 0} aria-label="Move service up"><ArrowUp className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => move(service, 1)} disabled={index === services.length - 1} aria-label="Move service down"><ArrowDown className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => toggle(service)}>{service.is_visible_on_storefront ? 'Hide' : 'Show'}</Button><Button variant="outline" size="sm" onClick={() => openForm(service)} aria-label="Edit service"><Edit2 className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => remove(service)} aria-label="Delete service"><Trash2 className="h-4 w-4 text-negative" /></Button></div></CardContent></Card>)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="dashboard-panel max-w-xl"><DialogHeader><DialogTitle className="font-display text-ink">{editing ? 'Edit service' : 'Add service'}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4"><div><Label>Service name *</Label><Input className="dashboard-input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div><Label>Description</Label><textarea className="dashboard-input mt-1 min-h-24 w-full px-3 py-2 text-sm" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div><Label>Price <span className="font-normal text-text-muted">(leave blank for “contact for pricing”)</span></Label><Input type="number" min="0" step="0.01" className="dashboard-input mt-1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div><Label>Service image</Label><Input type="file" accept="image/*" className="dashboard-input mt-1" onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] || null })} /></div><Button type="submit" disabled={saving} className="dashboard-primary w-full">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}</Button></form></DialogContent></Dialog>
  </main>
}
