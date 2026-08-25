'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getSales, addSale } from '@/app/actions/business'
import { ClipboardList, Plus, Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SalesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [filteredSales, setFilteredSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product_name: '',
    quantity: 0,
    unit_price: 0,
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
            sale.id.toLowerCase().includes(searchQuery.toLowerCase())
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
      const result = await getSales(businessData.id)
      setSales(result.data || [])
      setFilteredSales(result.data || [])
    } catch (error) {
      console.error('[Sales] Error:', error)
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_name || formData.quantity <= 0 || formData.unit_price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const total_amount = formData.quantity * formData.unit_price
      const result = await addSale(business.id, {
        ...formData,
        total_amount,
      })

      if (result.success) {
        toast.success('Sale recorded successfully!')
        setDialogOpen(false)
        setFormData({
          sale_date: new Date().toISOString().split('T')[0],
          product_name: '',
          quantity: 0,
          unit_price: 0,
          payment_method: 'cash',
          notes: '',
        })
        loadData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('[Sales] Error:', error)
      toast.error('An error occurred')
    }
  }

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const averageSale = sales.length > 0 ? totalSales / sales.length : 0

  // Sales by day for chart
  const salesByDay = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.sale_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const existing = acc.find((item) => item.date === date)
      if (existing) {
        existing.amount += sale.total_amount
        existing.count += 1
      } else {
        acc.push({ date, amount: sale.total_amount, count: 1 })
      }
      return acc
    },
    [] as Array<{ date: string; amount: number; count: number }>
  ).slice(-14)

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center">
        <div className="text-text-secondary">Loading your sales...</div>
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
                  const saleDate = new Date(s.sale_date)
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
                <div>
                  <Label className="text-slate-300">Sale Date</Label>
                  <Input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_date: e.target.value })
                    }
                    className="dashboard-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Product Name *</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_price: parseFloat(e.target.value) })
                      }
                      className="dashboard-input mt-1"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
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
                <Button type="submit" className="dashboard-primary w-full">
                  Record Sale
                </Button>
              </form>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="py-3 px-4">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">{sale.product_name}</td>
                        <td className="dashboard-number py-3 px-4 text-center">{sale.quantity}</td>
                        <td className="dashboard-number py-3 px-4 text-right">N{sale.unit_price.toLocaleString()}</td>
                        <td className="dashboard-number py-3 px-4 text-right font-semibold text-positive">
                          N{sale.total_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                            <span className="rounded bg-blue/10 px-2 py-1 text-blue">
                            {sale.payment_method}
                          </span>
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
