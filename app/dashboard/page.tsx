'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getBusiness, getSales, getExpenses, getInventory, getInsights } from '@/app/actions/business'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Plus, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { addSale } from '@/app/actions/business'

export default function DashboardPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    product_name: '',
    quantity: 0,
    unit_price: 0,
    payment_method: 'cash',
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard/setup'
        return
      }

      setBusiness(businessData)

      const [salesData, expensesData, inventoryData, insightsData] = await Promise.all([
        getSales(businessData.id),
        getExpenses(businessData.id),
        getInventory(businessData.id),
        getInsights(businessData.id),
      ])

      setSales(salesData.data || [])
      setExpenses(expensesData.data || [])
      setInventory(inventoryData.data || [])
      setInsights(insightsData.data || [])
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_name || formData.quantity <= 0 || formData.unit_price <= 0) {
      toast.error('Please fill in all fields')
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
        })
        loadDashboardData()
      } else {
        toast.error(result.error || 'Failed to add sale')
      }
    } catch (error) {
      console.error('[Sales] Error:', error)
      toast.error('An error occurred')
    }
  }

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const profit = totalSales - totalExpenses
  const lowStockItems = inventory.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10))

  // Get sales by date for chart
  const salesByDate = sales
    .reduce(
      (acc, sale) => {
        const date = new Date(sale.sale_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.amount += sale.total_amount
        } else {
          acc.push({ date, amount: sale.total_amount })
        }
        return acc
      },
      [] as Array<{ date: string; amount: number }>
    )
    .slice(-7)

  // Expense breakdown for pie chart
  const expenseByCategory = expenses.reduce(
    (acc, expense) => {
      const existing = acc.find((item) => item.name === expense.category)
      if (existing) {
        existing.value += expense.amount
      } else {
        acc.push({ name: expense.category, value: expense.amount })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>
  )

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">{business?.business_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Sales"
            value={`₦${totalSales.toLocaleString()}`}
            change={`${sales.length} transactions`}
            changeType="positive"
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Net Profit"
            value={`₦${profit.toLocaleString()}`}
            change={`${((profit / totalSales) * 100).toFixed(1)}% margin`}
            changeType={profit > 0 ? 'positive' : 'negative'}
          />
          <StatsCard
            icon={<Package className="w-6 h-6" />}
            label="Inventory Items"
            value={inventory.length}
            change={`${lowStockItems.length} low stock`}
            changeType={lowStockItems.length > 0 ? 'negative' : 'positive'}
          />
          <StatsCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Total Expenses"
            value={`₦${totalExpenses.toLocaleString()}`}
            change={`${expenses.length} entries`}
            changeType="neutral"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {salesByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">
                  No sales data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Distribution */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">
                  No expense data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur mb-8">
          <CardHeader><CardTitle className="text-white">Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {insights.length > 0 ? insights.map((insight) => (
              <details key={insight.id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                <summary className="cursor-pointer text-white font-medium capitalize">{insight.insight_type.replaceAll('_', ' ')}</summary>
                <p className="mt-3 text-xs uppercase tracking-wide text-blue-300">AI summary</p>
                <p className="mt-1 text-slate-300">{insight.summary_text}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-emerald-300">Computed from your data</p>
                <pre className="mt-1 overflow-x-auto text-xs text-slate-400">{JSON.stringify(insight.payload, null, 2)}</pre>
              </details>
            )) : <p className="text-slate-400">No insights available yet.</p>}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Recent Sales</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Record a Sale</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSale} className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Product Name</Label>
                      <Input
                        name="product_name"
                        value={formData.product_name}
                        onChange={(e) =>
                          setFormData({ ...formData, product_name: e.target.value })
                        }
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Quantity</Label>
                      <Input
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: parseInt(e.target.value) })
                        }
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Unit Price</Label>
                      <Input
                        name="unit_price"
                        type="number"
                        value={formData.unit_price}
                        onChange={(e) =>
                          setFormData({ ...formData, unit_price: parseFloat(e.target.value) })
                        }
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Record Sale
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sales.slice(0, 5).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{sale.product_name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-green-400">
                        ₦{sale.total_amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No sales recorded yet</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.product_name}</p>
                        <p className="text-xs text-slate-400">
                          {item.quantity_in_stock} in stock
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-400">Low stock</p>
                        <p className="text-xs text-slate-400">
                          Reorder: {item.reorder_level}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">All items in stock</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
