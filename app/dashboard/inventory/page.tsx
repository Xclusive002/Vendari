'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getMetaCatalogs, syncMetaCatalog } from '@/app/actions/business'
import { Plus, Edit2, AlertTriangle, Package, UploadCloud, RefreshCw, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'
import { VoiceInputButton } from '@/components/voice-input-button'
import { QuickRestockGrid } from '@/components/quick-restock-grid'

type CatalogImportItem = {
  product_name: string
  category: string
  qty_in_stock: number
  selling_price: number
  unit_cost: number
  description: string
}

type CatalogColumn = 'product_name' | 'category' | 'qty_in_stock' | 'selling_price' | 'unit_cost' | 'description' | 'ignore'

const catalogFields: Array<{ value: CatalogColumn; label: string }> = [
  { value: 'product_name', label: 'Product name' },
  { value: 'category', label: 'Category' },
  { value: 'qty_in_stock', label: 'Stock quantity' },
  { value: 'selling_price', label: 'Selling price' },
  { value: 'unit_cost', label: 'Unit cost' },
  { value: 'description', label: 'Description' },
  { value: 'ignore', label: 'Ignore column' },
]

const demoCatalog = `product_name,category,qty_in_stock,selling_price,unit_cost,description
Premium Ankara,Textiles,18,18500,9500,Soft, premium fabric for event wear
Leather Sandals,Footwear,12,24000,12000,Comfortable and durable everyday pair
Gift Box Set,Home & Gift,28,12500,6200,Curated festive gift bundle
Cedar Candle,Home & Gift,35,8900,4300,A warm, long-lasting candle for gifting`

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (character === ',' && !insideQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  cells.push(current.trim())
  return cells
}

function cleanNumber(raw: unknown, fallback = 0) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const normalized = raw.replace(/[^0-9.\-]/g, '')
    const value = Number(normalized)
    if (Number.isFinite(value)) return value
  }

  return fallback
}

function normalizeCatalogImportEntry(entry: Record<string, unknown>): CatalogImportItem | null {
  const productName = String(entry.product_name ?? entry.name ?? entry.title ?? entry.item ?? '').trim()
  if (!productName) return null

  const qtyInStock = Math.max(0, Math.round(cleanNumber(entry.qty_in_stock ?? entry.quantity ?? entry.stock ?? entry.inventory ?? entry.quantity_in_stock, 0)))
  const sellingPrice = Math.max(0, cleanNumber(entry.selling_price ?? entry.price ?? entry.amount ?? entry.unit_price ?? entry.sale_price, 0))
  const unitCost = Math.max(0, cleanNumber(entry.unit_cost ?? entry.cost_price ?? entry.cost ?? entry.base_price, 0))

  return {
    product_name: productName,
    category: String(entry.category ?? entry.type ?? entry.subcategory ?? '').trim(),
    qty_in_stock: qtyInStock,
    selling_price: sellingPrice,
    unit_cost: unitCost,
    description: String(entry.description ?? entry.details ?? entry.summary ?? '').trim(),
  }
}

function parseCatalogImport(rawText: string): CatalogImportItem[] {
  const cleaned = rawText.trim()
  if (!cleaned) return []

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => normalizeCatalogImportEntry((entry ?? {}) as Record<string, unknown>))
        .filter((entry): entry is CatalogImportItem => Boolean(entry))
    }

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)) {
      return ((parsed as Record<string, unknown>).items as unknown[])
        .map((entry) => normalizeCatalogImportEntry((entry ?? {}) as Record<string, unknown>))
        .filter((entry): entry is CatalogImportItem => Boolean(entry))
    }
  } catch {
    // JSON parse failed; we will fall back to CSV/plain-text parsing below.
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const firstLine = lines[0].toLowerCase()
  const isHeader = /product|name|category|price|stock|qty/i.test(firstLine)

  const dataLines = isHeader ? lines.slice(1) : lines
  if (!dataLines.length) return []

  const headers = isHeader ? parseCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/[^a-z]/g, '')) : []

  const rows = dataLines.map((line) => parseCsvLine(line))

  if (isHeader && headers.length >= 2) {
    return rows
      .map((cells) => {
        const values: Record<string, string> = {}

        headers.forEach((header, index) => {
          values[header] = cells[index] ?? ''
        })

        return normalizeCatalogImportEntry({
          product_name: values.productname ?? values.name ?? values.title ?? values.item ?? '',
          category: values.category ?? values.type ?? values.subcategory ?? '',
          qty_in_stock: values.qtyinstock ?? values.quantity ?? values.stock ?? values.inventory ?? '0',
          selling_price: values.sellingprice ?? values.price ?? values.amount ?? values.unitprice ?? '0',
          unit_cost: values.unitcost ?? values.costprice ?? values.cost ?? '0',
          description: values.description ?? values.details ?? values.summary ?? '',
        })
      })
      .filter((entry): entry is CatalogImportItem => Boolean(entry))
  }

  return rows
    .map((cells) => {
      const [maybeProduct, maybeCategoryOrPrice, maybePriceOrStock, maybeStockOrPrice, ...rest] = cells
      const productName = maybeProduct ?? ''
      if (!productName) return null

      const category = maybeCategoryOrPrice && /[a-z]/i.test(maybeCategoryOrPrice) ? maybeCategoryOrPrice : ''
      const sellingPrice = cleanNumber((category ? maybePriceOrStock : maybeCategoryOrPrice) ?? '0', 0)
      const qtyInStock = cleanNumber((category ? maybeStockOrPrice : maybePriceOrStock) ?? '0', 0)
      const description = rest.join(' ') || ''

      return {
        product_name: productName,
        category,
        qty_in_stock: Math.max(0, Math.round(qtyInStock)),
        selling_price: Math.max(0, sellingPrice),
        unit_cost: Math.max(0, sellingPrice * 0.55),
        description,
      }
    })
    .filter((entry): entry is CatalogImportItem => Boolean(entry))
}

function detectCatalogMapping(headers: string[]) {
  return headers.map((header) => {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, '')
    if (/product|item|title|name/.test(normalized)) return 'product_name' as CatalogColumn
    if (/category|type|subcategory/.test(normalized)) return 'category' as CatalogColumn
    if (/qty|quantity|stock|inventory/.test(normalized)) return 'qty_in_stock' as CatalogColumn
    if (/selling|sale|price|amount|unitprice/.test(normalized)) return 'selling_price' as CatalogColumn
    if (/cost|baseprice/.test(normalized)) return 'unit_cost' as CatalogColumn
    if (/description|details|summary/.test(normalized)) return 'description' as CatalogColumn
    return 'ignore' as CatalogColumn
  })
}

function parseCatalogWithMapping(rawText: string, mapping: CatalogColumn[]) {
  const lines = rawText.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return parseCatalogImport(rawText)

  const rows = lines.slice(1).map(parseCsvLine)
  return rows
    .map((cells) => {
      const entry: Record<string, string> = {}
      mapping.forEach((field, index) => {
        if (field !== 'ignore') entry[field] = cells[index] ?? ''
      })
      return normalizeCatalogImportEntry(entry)
    })
    .filter((entry): entry is CatalogImportItem => Boolean(entry))
}

export default function InventoryPage() {
  const [business, setBusiness] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [catalogText, setCatalogText] = useState('')
  const [catalogPreview, setCatalogPreview] = useState<CatalogImportItem[]>([])
  const [catalogImporting, setCatalogImporting] = useState(false)
  const [catalogFileName, setCatalogFileName] = useState('')
  const [catalogHeaders, setCatalogHeaders] = useState<string[]>([])
  const [catalogMapping, setCatalogMapping] = useState<CatalogColumn[]>([])
  const [metaCatalogs, setMetaCatalogs] = useState<Array<{ id: string; name: string; product_count?: number }>>([])
  const [metaCatalogId, setMetaCatalogId] = useState('')
  const [metaConfigured, setMetaConfigured] = useState<boolean | null>(null)
  const [metaSyncing, setMetaSyncing] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category: '',
    quantity_in_stock: 0,
    reorder_level: 10,
    unit_cost: 0,
    selling_price: 0,
    supplier_name: '',
    supplier_contact: '',
    description: '',
    images: [] as File[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard'
        return
      }

      setBusiness(businessData)
      const result = await getInventory(businessData.id)
      setInventory(result.data || [])
      const metaResult = await getMetaCatalogs(businessData.id)
      if (metaResult.success) {
        setMetaConfigured(metaResult.data.configured)
        setMetaCatalogs(metaResult.data.catalogs || [])
        setMetaCatalogId(metaResult.data.selected_catalog_id || metaResult.data.catalogs?.[0]?.id || '')
      }
    } catch (error) {
      console.error('[Inventory] Error:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setFormData({
        product_name: item.product_name,
        product_code: item.product_code || '',
        category: item.category || '',
        quantity_in_stock: item.quantity_in_stock,
        reorder_level: item.reorder_level || 10,
        unit_cost: item.unit_cost || 0,
        selling_price: item.selling_price || 0,
        supplier_name: item.supplier_name || '',
        supplier_contact: item.supplier_contact || '',
        description: item.description || '',
        images: [],
      })
    } else {
      setEditingId(null)
      setFormData({
        product_name: '',
        product_code: '',
        category: '',
        quantity_in_stock: 0,
        reorder_level: 10,
        unit_cost: 0,
        selling_price: 0,
        supplier_name: '',
        supplier_contact: '',
        description: '',
        images: [],
      })
    }
    setDialogOpen(true)
  }

  const handleVoiceExtracted = (voiceData: any) => {
    // Gemini extracts for inventory: product_name, quantity_in_stock, unit_cost, selling_price
    setFormData((prev) => ({
      ...prev,
      product_name: voiceData.product_name || prev.product_name,
      ...(voiceData.quantity_in_stock !== undefined && { quantity_in_stock: voiceData.quantity_in_stock }),
      ...(voiceData.unit_cost !== undefined && { unit_cost: voiceData.unit_cost }),
      ...(voiceData.selling_price !== undefined && { selling_price: voiceData.selling_price }),
    }))
  }

  const handleCatalogPreview = () => {
    const parsed = catalogMapping.length ? parseCatalogWithMapping(catalogText, catalogMapping) : parseCatalogImport(catalogText)

    if (!parsed.length) {
      toast.error('Add a CSV, JSON, or WhatsApp-style catalog snippet to preview importable products.')
      return
    }

    setCatalogPreview(parsed)
    toast.success(`Preview ready: ${parsed.length} products found.`)
  }

  const handleCatalogFile = async (file: File) => {
    const text = await file.text()
    setCatalogFileName(file.name)
    setCatalogText(text)

    if (file.name.toLowerCase().endsWith('.json')) {
      setCatalogHeaders([])
      setCatalogMapping([])
      const parsed = parseCatalogImport(text)
      setCatalogPreview(parsed)
      if (!parsed.length) toast.error('This JSON file does not contain recognizable product records.')
      return
    }

    const firstLine = text.split(/\r?\n/)[0] || ''
    const headers = parseCsvLine(firstLine)
    setCatalogHeaders(headers)
    setCatalogMapping(detectCatalogMapping(headers))
    setCatalogPreview([])
  }

  const handleMetaSync = async () => {
    if (!metaCatalogId) {
      toast.error('Choose a Meta catalog first.')
      return
    }

    setMetaSyncing(true)
    const result = await syncMetaCatalog(business.id, metaCatalogId)
    setMetaSyncing(false)

    if (result.success) {
      toast.success(result.data.detail || 'Meta catalog synced into inventory.')
      await loadData()
    } else {
      toast.error(result.error)
    }
  }

  const handleCatalogImport = async () => {
    if (!catalogPreview.length) {
      toast.error('Preview a catalog before importing it.')
      return
    }

    setCatalogImporting(true)

    let created = 0
    let failed = 0

    for (const item of catalogPreview) {
      const result = await addInventoryItem(business.id, {
        product_name: item.product_name,
        product_code: '',
        category: item.category,
        quantity_in_stock: item.qty_in_stock,
        reorder_level: Math.max(5, Math.round(item.qty_in_stock * 0.2 || 5)),
        unit_cost: item.unit_cost || item.selling_price * 0.55,
        selling_price: item.selling_price || item.unit_cost,
        description: item.description,
      })

      if (result.success) {
        created += 1
      } else {
        failed += 1
      }
    }

    setCatalogImporting(false)
    setCatalogText('')
    setCatalogPreview([])

    if (created > 0) {
      toast.success(`Imported ${created} items into inventory${failed ? ` (${failed} skipped)` : ''}.`)
      await loadData()
    }

    if (!created) {
      toast.error('Nothing was imported. Check the catalog format and try again.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingRef.current) return

    if (!formData.product_name) {
      toast.error('Product name is required')
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      if (editingId) {
        const result = await updateInventoryItem(business.id, editingId, formData)
        if (result.success) {
          toast.success('Item updated successfully!')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await addInventoryItem(business.id, formData)
        if (result.success) {
          toast.success('Item added successfully!')
        } else {
          toast.error(result.error)
        }
      }

      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('[Inventory] Error:', error)
      toast.error('An error occurred')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center">
        <div className="text-text-secondary">Loading your inventory...</div>
      </div>
    )
  }

  const lowStockItems = inventory.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10))
  const inventoryValue = inventory.reduce(
    (sum, item) => sum + Number(item.selling_price || item.unit_cost || 0) * Number(item.quantity_in_stock || 0),
    0,
  )

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Inventory</h1>
            <p className="mt-2 text-text-secondary">Know what is on the shelf before a customer asks for it.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="dashboard-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="dashboard-panel max-w-2xl">
              <DialogHeader>
                  <DialogTitle className="font-display text-ink">
                  {editingId ? 'Edit Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-black">Item information</h3>
                  {!editingId && (
                    <VoiceInputButton
                      context="inventory"
                      businessId={business.id}
                      onExtracted={handleVoiceExtracted}
                      className="text-xs"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-black">Product Name *</Label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="dashboard-input mt-1"
                    placeholder="Product name"
                    required
                  />
                </div>

                <div>
                  <Label className="text-black">Product description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="dashboard-input mt-1 min-h-24 w-full px-3 py-2 text-sm"
                    placeholder="What should customers know about this product?"
                  />
                </div>

                <div>
                  <Label className="text-black">Product photos</Label>
                  <Input type="file" accept="image/*" multiple onChange={(e) => setFormData({ ...formData, images: Array.from(e.target.files || []).slice(0, 6) })} className="dashboard-input mt-1" />
                  <p className="mt-1 text-xs text-text-muted">Choose up to 6 photos. The first photo is the storefront cover.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black">Product Code</Label>
                    <Input
                      value={formData.product_code}
                      onChange={(e) =>
                        setFormData({ ...formData, product_code: e.target.value })
                      }
                      className="dashboard-input mt-1"
                      placeholder="SKU or code"
                    />
                  </div>
                  <div>
                    <Label className="text-black">Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="dashboard-input mt-1"
                      placeholder="e.g., Electronics"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black">Quantity in Stock</Label>
                    <Input
                      type="number"
                      value={formData.quantity_in_stock}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity_in_stock: parseInt(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-black">Reorder Level</Label>
                    <Input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({ ...formData, reorder_level: parseInt(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black">Unit Cost (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-black">Selling Price (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price: parseFloat(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Supplier Name</Label>
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_name: e.target.value })
                    }
                    className="dashboard-input mt-1"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Supplier Contact</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_contact: e.target.value })
                    }
                    className="dashboard-input mt-1"
                    placeholder="Phone or email"
                  />
                </div>

                <LoadingButton type="submit" loading={saving} className="dashboard-primary w-full">{editingId ? 'Update Item' : 'Add Item'}</LoadingButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30 mb-8">
            <CardContent className="border border-warning/25 bg-warning/5 p-6 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-warning font-semibold">{lowStockItems.length} items low in stock</p>
                <p className="text-text-secondary text-sm">Review these items before the next customer asks for them.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Restock Grid */}
        <QuickRestockGrid items={inventory} businessId={business.id} onRestockAdded={loadData} />

        <Card className="dashboard-panel mb-8">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">WhatsApp catalog import</p>
                <CardTitle className="mt-2 font-display text-ink">Import your catalog into inventory</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCatalogText(demoCatalog)
                  setCatalogPreview(parseCatalogImport(demoCatalog))
                }}
                className="border-blue/30 text-blue"
              >
                Load demo catalog
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-border bg-bg p-3 sm:p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Paste catalog data</label>
                <label
                  htmlFor="catalog-file"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const file = event.dataTransfer.files[0]
                    if (file) void handleCatalogFile(file)
                  }}
                  className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue/40 bg-blue/5 px-3 py-3 text-sm text-text-secondary transition hover:border-blue hover:bg-blue/10"
                >
                  <UploadCloud className="h-5 w-5 shrink-0 text-blue" />
                  <span className="min-w-0 flex-1"><strong className="block text-ink">Drop a CSV or JSON file here</strong><span className="text-xs">or tap to browse your device</span></span>
                  {catalogFileName && <span className="max-w-28 truncate text-xs font-semibold text-blue">{catalogFileName}</span>}
                  <input id="catalog-file" type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleCatalogFile(file) }} />
                </label>
                <textarea
                  value={catalogText}
                  onChange={(event) => setCatalogText(event.target.value)}
                  placeholder={'product_name,category,qty_in_stock,selling_price,unit_cost,description\nPremium Ankara,Textiles,18,18500,9500,Premium fabric'}
                  className="min-h-[180px] w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-ink outline-none ring-0 transition focus:border-blue"
                />
                {catalogHeaders.length > 0 && (
                  <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-blue" /><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Map your columns</p></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {catalogHeaders.map((header, index) => (
                        <label key={`${header}-${index}`} className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="min-w-0 flex-1 truncate font-medium text-ink">{header || `Column ${index + 1}`}</span>
                          <select value={catalogMapping[index] || 'ignore'} onChange={(event) => setCatalogMapping((current) => current.map((value, mappingIndex) => mappingIndex === index ? event.target.value as CatalogColumn : value))} className="dashboard-input h-9 max-w-[145px] text-xs">
                            {catalogFields.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={handleCatalogPreview} className="dashboard-primary flex-1">Preview import</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCatalogImport}
                    disabled={!catalogPreview.length || catalogImporting}
                    className="flex-1"
                  >
                    {catalogImporting ? 'Importing...' : `Import ${catalogPreview.length} products`}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-blue/20 bg-blue/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue">What this accepts</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-text-secondary">
                  <li>• CSV rows with product, category, stock, and price fields</li>
                  <li>• JSON arrays from catalog exports</li>
                  <li>• WhatsApp catalog snippets copied into a clean list</li>
                </ul>

                <div className="mt-5 rounded-xl border border-border bg-surface p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Preview status</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{catalogPreview.length}</p>
                  <p className="text-xs text-text-secondary">products ready to add</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#25D366]/25 bg-[#25D366]/5 p-4">
                <div className="flex items-start gap-3"><RefreshCw className="mt-0.5 h-5 w-5 text-[#25D366]" /><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#25D366]">Live Meta sync</p><h3 className="mt-2 font-display text-lg font-semibold text-ink">Pull products from WhatsApp Business</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Sync your real Meta catalog into Vendari. Existing items are updated by retailer ID, so repeated syncs do not create duplicates.</p></div></div>
                {metaConfigured === false ? <p className="mt-4 rounded-xl bg-surface p-3 text-xs leading-5 text-text-secondary">Meta sync is not configured yet. Add the WhatsApp access token and business account ID on the backend.</p> : <div className="mt-4 space-y-2"><select value={metaCatalogId} onChange={(event) => setMetaCatalogId(event.target.value)} className="dashboard-input w-full text-sm"><option value="">Choose a catalog</option>{metaCatalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.name}{catalog.product_count ? ` (${catalog.product_count} products)` : ''}</option>)}</select><Button type="button" onClick={handleMetaSync} disabled={!metaCatalogId || metaSyncing} className="w-full bg-[#25D366] text-white hover:bg-[#1fb958]"><RefreshCw className={`mr-2 h-4 w-4 ${metaSyncing ? 'animate-spin' : ''}`} />{metaSyncing ? 'Syncing Meta catalog...' : 'Sync real Meta catalog'}</Button></div>}
              </div>
            </div>

            {catalogPreview.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {catalogPreview.slice(0, 6).map((item, index) => (
                  <div key={`${item.product_name}-${index}`} className="rounded-xl border border-border bg-surface p-3">
                    <p className="font-semibold text-ink">{item.product_name}</p>
                    <p className="mt-1 text-xs text-text-secondary">{item.category || 'General'}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                      <span>{item.qty_in_stock} in stock</span>
                      <span>₦{Number(item.selling_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Product inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="dashboard-table w-full text-sm text-text-secondary">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold">Product</th>
                      <th className="text-left py-3 px-4 font-semibold">Code</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">In Stock</th>
                      <th className="text-left py-3 px-4 font-semibold">Unit Cost</th>
                      <th className="text-left py-3 px-4 font-semibold">Selling Price</th>
                      <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLowStock = item.quantity_in_stock <= (item.reorder_level || 10)
                      return (
                        <tr
                          key={item.id}
                          className={`${
                            isLowStock ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-ink">{item.product_name}</td>
                          <td className="py-3 px-4">{item.product_code || '-'}</td>
                          <td className="py-3 px-4">{item.category || '-'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                isLowStock
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-green-500/20 text-green-300'
                              }`}
                            >
                              {item.quantity_in_stock}
                            </span>
                          </td>
                          <td className="py-3 px-4">₦{item.unit_cost?.toLocaleString()}</td>
                          <td className="py-3 px-4">₦{item.selling_price?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs">{item.supplier_name || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleOpenDialog(item)}
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:bg-blue-500/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (!window.confirm(`Delete ${item.product_name}? This cannot be undone.`)) return
                                  const result = await deleteInventoryItem(business.id, item.id)
                                  if (result.success) {
                                    toast.success('Item deleted successfully!')
                                    loadData()
                                  } else {
                                    toast.error(result.error)
                                  }
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-negative hover:bg-negative/10"
                              >
                                ×
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard-empty"><Package className="h-8 w-8 text-blue" /><p>No products yet. Add your first item to start tracking stock.</p><Button onClick={() => handleOpenDialog()} className="dashboard-primary">Add your first item</Button></div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
