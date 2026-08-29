'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateSaleReceipt, getBusiness, getInventory, getSales, addSale } from '@/app/actions/business'
import { ClipboardList, Plus, Receipt, Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'
import { VoiceInputButton } from '@/components/voice-input-button'
import { QuickSaleGrid } from '@/components/quick-sale-grid'

export default function SalesPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [filteredSales, setFilteredSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitRef = useRef(false)
  const [receiptError, setReceiptError] = useState('')
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    payment_method: 'cash',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredSales(
        sales.filter(
          (sale) =>
            sale.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(sale.id).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredSales(sales)
    }
  }, [searchQuery, sales])

  const loadData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard/setup'
        return
      }

      setBusiness(businessData)
      const [salesResult, inventoryResult] = await Promise.all([getSales(businessData.id), getInventory(businessData.id)])
      setSales(salesResult.data || [])
      setFilteredSales(salesResult.data || [])
      setInventory(inventoryResult.data || [])
    } catch (error) {
      console.error('[Sales] Error:', error)
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitRef.current) return
    setSubmitError('')

    const quantity = Number(formData.quantity)
    if (!formData.item || !Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Please fill in all required fields')
      setSubmitError('Select an inventory item and enter a quantity greater than zero.')
      return
    }

    submitRef.current = true
    setSubmitting(true)
    try {
      const result = await addSale(business.id, {
        item: Number(formData.item),
        quantity,
        payment_method: formData.payment_method,
      })

      if (result.success) {
        toast.success('Sale recorded successfully!')
        setDialogOpen(false)
        setFormData({
          item: '',
          quantity: '',
          payment_method: 'cash',
          notes: '',
        })
        loadData()
      } else {
        const error = result.error || 'The sale could not be recorded.'
        toast.error(error)
        setSubmitError(error)
      }
    } catch (error) {
      console.error('[Sales] Error:', error)
      const message = error instanceof Error ? error.message : 'An error occurred while recording the sale.'
      toast.error(message)
      setSubmitError(message)
    } finally {
      submitRef.current = false
      setSubmitting(false)
    }
  }

  const handleVoiceExtracted = (voiceData: any) => {
    // Gemini extracts: product_name, quantity, unit_price, item_id, estimated_total
    // Pre-fill the form with extracted data
    if (voiceData.item_id) {
      setFormData((prev) => ({
        ...prev,
        item: String(voiceData.item_id),
        quantity: String(voiceData.quantity),
      }))
    } else if (voiceData.product_name) {
      // Product not found; show warning and let user select manually
      toast.warning(`Product "${voiceData.product_name}" not found. Please select from the list.`)
      setFormData((prev) => ({
        ...prev,
        quantity: String(voiceData.quantity),
      }))
    }
  }

  const handleGenerateReceipt = async (sale: any) => {
    setReceiptError('')
    if (!business.has_complete_profile) {
      setReceiptError('Add your business address and phone number to start generating receipts')
      return
    }

    setReceiptLoadingId(String(sale.id))
    try {
      const result = await generateSaleReceipt(business.id, String(sale.id))
      if (result.success) {
        const receipt = result.data as { id: number }
        router.push(`/dashboard/receipts/${receipt.id}?data=${encodeURIComponent(JSON.stringify(result.data))}`)
      } else {
        const message = result.error || 'The receipt could not be generated.'
        toast.error(message)
        setReceiptError(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The receipt could not be generated.'
      toast.error(message)
      setReceiptError(message)
    } finally {
      setReceiptLoadingId(null)
    }
  }

  const selectedItem = inventory.find((item) => String(item.id) === formData.item)
  const quantityInput = Number(formData.quantity) || 0
  const estimatedTotal = quantityInput * Number(selectedItem?.selling_price || 0)
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const averageSale = sales.length > 0 ? totalSales / sales.length : 0

  // Sales by day for chart
  const salesByDay = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.sold_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const existing = acc.find((item: { date: string; amount: number; count: number }) => item.date === date)
      if (existing) {
        existing.amount += Number(sale.total || 0)
        existing.count += 1
      } else {
        acc.push({ date, amount: Number(sale.total || 0), count: 1 })
      }
      return acc
    },
    [] as Array<{ date: string; amount: number; count: number }>
  ).slice(-14)

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center">
        <PageSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink">Sales record</h1>
          <p className="mt-2 text-text-secondary">Keep every order visible so you know what is actually selling.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-panel">
            <CardContent className="p-6">
              <p className="text-text-secondary text-sm mb-2">Total sales</p>
              <p className="dashboard-number text-2xl font-medium text-ink">N{totalSales.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-2">{sales.length} transactions recorded</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-6">
              <p className="text-text-secondary text-sm mb-2">Average sale</p>
              <p className="dashboard-number text-2xl font-medium text-ink">N{averageSale.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-2">Per transaction</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-6">
              <p className="text-text-secondary text-sm mb-2">This month</p>
              <p className="dashboard-number text-2xl font-medium text-ink">
                {sales.filter((s) => {
                  const saleDate = new Date(s.sold_at)
                  const now = new Date()
                  return (
                    saleDate.getMonth() === now.getMonth() &&
                    saleDate.getFullYear() === now.getFullYear()
                  )
                }).length}
              </p>
              <p className="text-xs text-text-muted mt-2">Sales recorded</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="dashboard-panel mb-8">
          <CardHeader>
            <CardTitle className="font-display text-ink">Sales trend (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="dashboard-empty">
                <ClipboardList className="h-8 w-8 text-blue" />
                <p>No sales yet. Record your first sale to see your trend here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Sale Grid */}
        <QuickSaleGrid businessId={business.id} onSaleAdded={loadData} />

        {/* Search and Add */}
        <div className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search by product name or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dashboard-input pl-10"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="dashboard-primary whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="dashboard-panel">
              <DialogHeader>
                <DialogTitle className="font-display text-ink">Record a new sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSale} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-slate-300">Enter sale details</h3>
                  <VoiceInputButton
                    context="sale"
                    businessId={business.id}
                    onExtracted={handleVoiceExtracted}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Inventory Item *</Label>
                  <select value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} className="dashboard-input mt-1 w-full px-3 py-2" required>
                    <option value="">Select an item</option>
                    {inventory.map((item) => <option key={item.id} value={item.id}>{item.product_name} ({item.quantity_in_stock} in stock)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="dashboard-input mt-1"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Unit Price</Label>
                    <Input
                      value={selectedItem ? `₦${Number(selectedItem.selling_price || 0).toLocaleString()}` : ''}
                      className="dashboard-input mt-1"
                      placeholder="Select an item"
                      readOnly
                    />
                  </div>
                </div>
                <p className="text-sm text-text-secondary">Estimated total: <span className="font-mono font-medium text-ink">₦{estimatedTotal.toLocaleString()}</span></p>
                <div>
                  <Label className="text-slate-300">Payment Method</Label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value })
                    }
                    className="dashboard-input mt-1 w-full px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="dashboard-input mt-1"
                    placeholder="Optional notes"
                  />
                </div>
                {submitError && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{submitError}</p>}
                <Button type="submit" disabled={submitting} className="dashboard-primary w-full">
                  {submitting ? 'Recording...' : 'Record Sale'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={Boolean(receiptError)} onOpenChange={(open) => !open && setReceiptError('')}>
            <DialogContent className="dashboard-panel">
              <DialogHeader><DialogTitle className="font-display text-ink">Complete your business profile</DialogTitle></DialogHeader>
              <p className="text-sm leading-6 text-text-secondary">{receiptError}</p>
              <Button onClick={() => router.push('/dashboard/settings')} className="dashboard-primary w-full">Go to Settings</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales Table */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">All sales</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="dashboard-table w-full text-sm text-text-secondary">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Product</th>
                      <th className="text-center py-3 px-4 font-semibold">Qty</th>
                      <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                      <th className="text-right py-3 px-4 font-semibold">Total</th>
                      <th className="text-left py-3 px-4 font-semibold">Method</th>
                      <th className="text-left py-3 px-4 font-semibold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="py-3 px-4">
                          {new Date(sale.sold_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">{sale.product_name}</td>
                        <td className="dashboard-number py-3 px-4 text-center">{sale.quantity}</td>
                        <td className="dashboard-number py-3 px-4 text-right">₦{Number(sale.unit_price || 0).toLocaleString()}</td>
                        <td className="dashboard-number py-3 px-4 text-right font-semibold text-positive">
                          ₦{Number(sale.total || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                            <span className="rounded bg-blue/10 px-2 py-1 text-blue">
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                                  <LoadingButton type="button" onClick={() => handleGenerateReceipt(sale)} size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" loading={receiptLoadingId === String(sale.id)} aria-label="Generate receipt">
                            <Receipt className="h-4 w-4" />
                            <span className="sr-only">{receiptLoadingId === String(sale.id) ? 'Generating receipt' : 'Generate receipt'}</span>
                                  </LoadingButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard-empty"><ClipboardList className="h-8 w-8 text-blue" /><p>{searchQuery ? 'No sales match that search. Try a product name or transaction ID.' : 'No sales yet. Record your first sale to start seeing your business history.'}</p>{!searchQuery && <Button onClick={() => setDialogOpen(true)} className="dashboard-primary">Record your first sale</Button>}</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
