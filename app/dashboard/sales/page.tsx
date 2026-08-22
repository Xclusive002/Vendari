'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getSales, addSale } from '@/app/actions/business'
import { Plus, Search, Download } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardNav />

      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sales Record</h1>
          <p className="text-slate-400 mt-2">Track and analyze all your sales transactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-slate-400 text-sm mb-2">Total Sales</p>
              <p className="text-2xl font-bold text-white">₦{totalSales.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-2">{sales.length} transactions</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-slate-400 text-sm mb-2">Average Sale</p>
              <p className="text-2xl font-bold text-white">₦{averageSale.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-2">Per transaction</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <p className="text-slate-400 text-sm mb-2">This Month</p>
              <p className="text-2xl font-bold text-white">
                {sales.filter((s) => {
                  const saleDate = new Date(s.sale_date)
                  const now = new Date()
                  return (
                    saleDate.getMonth() === now.getMonth() &&
                    saleDate.getFullYear() === now.getFullYear()
                  )
                }).length}
              </p>
              <p className="text-xs text-slate-500 mt-2">Sales recorded</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-white">Sales Trend (Last 14 Days)</CardTitle>
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
              <div className="h-300 flex items-center justify-center text-slate-400">
                No sales data yet
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
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Record a New Sale</DialogTitle>
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
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Product Name *</Label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
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
                      className="bg-slate-700 border-slate-600 text-white mt-1"
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
                      className="bg-slate-700 border-slate-600 text-white mt-1"
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
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded mt-1 px-3 py-2"
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
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Optional notes"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Record Sale
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">All Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
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
                      <tr key={sale.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="py-3 px-4">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">{sale.product_name}</td>
                        <td className="py-3 px-4 text-center">{sale.quantity}</td>
                        <td className="py-3 px-4 text-right">₦{sale.unit_price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-400">
                          ₦{sale.total_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            {sale.payment_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-12">
                {searchQuery ? 'No sales found matching your search' : 'No sales recorded yet'}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
