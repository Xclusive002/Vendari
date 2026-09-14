'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ImageOff, Package, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBusiness, getInventory, setAllInventoryStorefrontVisibility, setInventoryItemStorefrontVisibility } from '@/app/actions/business'
import { toast } from 'sonner'

export default function StorefrontProductsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const current = await getBusiness()
      if (!current) {
        setLoading(false)
        return
      }
      setBusiness(current)
      const result = await getInventory(current.id)
      if (result.success) setItems(result.data)
      else setItems([])
      if (!result.success) toast.error('Failed to load inventory')
      setLoading(false)
    }
    load()
  }, [])

  const pricedItems = useMemo(() => items.filter((item) => Number(item.selling_price || 0) > 0), [items])
  const visibleCount = items.filter((item) => item.is_visible_on_storefront).length
  const missingPhotoCount = items.filter((item) => !item.image).length
  const allVisible = items.length > 0 && visibleCount === items.length

  const setAllVisible = async (visible: boolean) => {
    if (!business) return
    setSaving(true)
    const result = await setAllInventoryStorefrontVisibility(business.id, visible)
    if (result.success) {
      setItems((current) => current.map((item) => ({ ...item, is_visible_on_storefront: visible })))
      toast.success(`${result.data.updated} products updated`)
    } else {
      toast.error(result.error)
    }
    setSaving(false)
  }

  const toggleItem = async (item: any) => {
    if (!business) return
    const visible = !item.is_visible_on_storefront
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, is_visible_on_storefront: visible } : currentItem))
    const result = await setInventoryItemStorefrontVisibility(business.id, item.id, visible)
    if (!result.success) {
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, is_visible_on_storefront: !visible } : currentItem))
      toast.error(result.error)
    }
  }

  if (loading) return <div className="dashboard-page"><div className="mx-auto max-w-6xl text-sm text-text-secondary">Loading products...</div></div>
  if (!business) return <div className="dashboard-page"><div className="mx-auto max-w-6xl text-sm text-text-secondary">Set up a business to manage storefront products.</div></div>

  return (
    <div className="dashboard-page">
      <main className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">Storefront</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Products</h1>
            <p className="mt-2 text-sm text-text-secondary">Your inventory is your catalog. Price an item and turn it on to show it in your shop.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAllVisible(true)} disabled={saving || allVisible}>Show all</Button>
            <Button variant="outline" onClick={() => setAllVisible(false)} disabled={saving || visibleCount === 0}>Hide all</Button>
          </div>
        </div>

        {missingPhotoCount > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue/20 bg-blue/5 p-4 text-sm text-text-secondary">
            <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
            <span>{missingPhotoCount} of your products have no photo - products with photos sell better.</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 p-4"><Package className="h-5 w-5 text-blue" /><div><p className="text-2xl font-semibold text-ink">{items.length}</p><p className="text-xs text-text-muted">Inventory items</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><Store className="h-5 w-5 text-emerald-600" /><div><p className="text-2xl font-semibold text-ink">{visibleCount}</p><p className="text-xs text-text-muted">Visible on storefront</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4"><AlertCircle className="h-5 w-5 text-amber-600" /><div><p className="text-2xl font-semibold text-ink">{items.length - pricedItems.length}</p><p className="text-xs text-text-muted">Missing a price</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-ink">All products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? <p className="py-8 text-center text-sm text-text-secondary">Add products to inventory and they will appear here.</p> : items.map((item) => {
              const hasPrice = Number(item.selling_price || 0) > 0
              return (
                <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.image ? <img src={item.image} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted"><ImageOff className="h-5 w-5" /></div>}
                    <div className="min-w-0"><p className="truncate font-semibold text-ink">{item.product_name}</p><p className="text-sm text-text-secondary">{hasPrice ? `N${Number(item.selling_price).toLocaleString()}` : 'No price set'}</p>{!hasPrice && <p className="text-xs text-amber-700">Cannot appear until a selling price is set.</p>}</div>
                  </div>
                  <label className="flex shrink-0 items-center gap-3 text-sm text-text-secondary"><span>{item.is_visible_on_storefront ? 'Shown' : 'Hidden'}</span><input type="checkbox" checked={Boolean(item.is_visible_on_storefront)} onChange={() => toggleItem(item)} className="h-5 w-5 accent-blue" aria-label={`Show ${item.product_name} on storefront`} /></label>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
