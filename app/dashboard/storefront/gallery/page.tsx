'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageSkeleton } from '@/components/ui/skeleton'
import { createGalleryImage, deleteGalleryImage, getBusiness, getGalleryImages, updateGalleryImage, type GalleryRecord } from '@/app/actions/business'

export default function StorefrontGalleryPage() {
  const [business, setBusiness] = useState<any>(null)
  const [images, setImages] = useState<GalleryRecord[]>([])
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<GalleryRecord | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    const current = await getBusiness()
    if (!current) return
    setBusiness(current)
    const result = await getGalleryImages(String(current.id))
    if (result.success) setImages(result.data)
    else toast.error(result.error)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openForm(image?: GalleryRecord) { setEditing(image || null); setCaption(image?.caption || ''); setFile(null); setOpen(true) }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!business || (!editing && !file)) return
    setSaving(true)
    const result = editing ? await updateGalleryImage(String(business.id), editing.id, { caption, imageFile: file }) : await createGalleryImage(String(business.id), { caption, imageFile: file as File, display_order: images.length })
    setSaving(false)
    if (!result.success) { toast.error(result.error); return }
    toast.success(editing ? 'Gallery image updated' : 'Gallery image added')
    setOpen(false)
    load()
  }
  async function remove(image: GalleryRecord) { if (!business || !window.confirm('Delete this gallery image?')) return; const result = await deleteGalleryImage(String(business.id), image.id); if (result.success) { toast.success('Gallery image deleted'); load() } else toast.error(result.error) }
  async function move(image: GalleryRecord, direction: -1 | 1) { if (!business) return; const index = images.findIndex((item) => item.id === image.id); const other = images[index + direction]; if (!other) return; await Promise.all([updateGalleryImage(String(business.id), image.id, { display_order: other.display_order }), updateGalleryImage(String(business.id), other.id, { display_order: image.display_order })]); load() }

  if (loading) return <PageSkeleton rows={4} />
  return <main className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront</p><h1 className="mt-2 font-display text-3xl font-semibold text-ink">Gallery</h1><p className="mt-2 text-text-secondary">Show the space, work, people, or results behind your business.</p></div><Button onClick={() => openForm()} className="dashboard-primary"><Plus className="mr-2 h-4 w-4" />Upload image</Button></div>{images.length === 0 ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><ImagePlus className="h-10 w-10 text-blue" /><h2 className="mt-4 font-display text-xl font-semibold text-ink">Your gallery is empty</h2><p className="mt-2 max-w-md text-sm text-text-secondary">Add images independently of products. They will appear on your public storefront in the order you choose.</p><Button onClick={() => openForm()} className="dashboard-primary mt-5"><Plus className="mr-2 h-4 w-4" />Add first image</Button></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => <Card key={image.id} className="overflow-hidden"><img src={image.image} alt={image.caption || 'Gallery image'} className="aspect-[4/3] w-full object-cover" /><CardContent className="p-4"><p className="min-h-10 text-sm text-text-secondary">{image.caption || 'No caption'}</p><div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => move(image, -1)} disabled={index === 0} aria-label="Move image up"><ArrowUp className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => move(image, 1)} disabled={index === images.length - 1} aria-label="Move image down"><ArrowDown className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => openForm(image)} aria-label="Edit caption"><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => remove(image)} aria-label="Delete image"><Trash2 className="h-4 w-4 text-negative" /></Button></div></CardContent></Card>)}</div>}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="dashboard-panel max-w-xl"><DialogHeader><DialogTitle className="font-display text-ink">{editing ? 'Edit gallery image' : 'Upload gallery image'}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4"><div><Label>Image {!editing && '*'}</Label><Input type="file" accept="image/*" className="dashboard-input mt-1" onChange={(event) => setFile(event.target.files?.[0] || null)} required={!editing} /></div><div><Label>Caption</Label><Input className="dashboard-input mt-1" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What should customers notice?" /></div><Button type="submit" disabled={saving} className="dashboard-primary w-full">{saving ? 'Saving…' : editing ? 'Save changes' : 'Upload image'}</Button></form></DialogContent></Dialog></main>
}
