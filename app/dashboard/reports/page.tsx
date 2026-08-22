'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getSales, getExpenses, addExpense } from '@/app/actions/business'
import { Plus, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ReportsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Other',
    description: '',
    amount: 0,
    payment_method: 'cash',
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard/setup'
        return
      }

      setBusiness(businessData)
      const [salesData, expensesData] = await Promise.all([
        getSales(businessData.id, dateRange.start, dateRange.end),
        getExpenses(businessData.id, dateRange.start, dateRange.end),
      ])

      setSales(salesData.data || [])
      setExpenses(expensesData.data || [])
    } catch (error) {
      console.error('[Reports] Error:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || formData.amount <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await addExpense(business.id, formData)

      if (result.success) {
        toast.success('Expense recorded successfully!')
        setDialogOpen(false)
        setFormData({
          expense_date: new Date().toISOString().split('T')[0],
          category: 'Other',
          description: '',
          amount: 0,
          payment_method: 'cash',
        })
        loadData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('[Expenses] Error:', error)
      toast.error('An error occurred')
    }
  }

  // Calculate metrics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const profit = totalSales - totalExpenses
  const profitMargin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0

  // Prepare data for profit & loss chart
  const dailyData = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.sale_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      const existing = acc.find((item) => item.date === date)
      if (existing) {
        existing.revenue += sale.total_amount
      } else {
        acc.push({ date, revenue: sale.total_amount, expenses: 0 })
      }
      return acc
    },
    [] as Array<{ date: string; revenue: number; expenses: number }>
  )

  // Add expenses to daily data
  expenses.forEach((expense) => {
    const date = new Date(expense.expense_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const existing = dailyData.find((item) => item.date === date)
    if (existing) {
      existing.expenses += expense.amount
    } else {
      dailyData.push({ date, revenue: 0, expenses: expense.amount })
    }
  })

  // Sort by date
  dailyData.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Expense breakdown
  const expenseByCategory = expenses.reduce(
    (acc, expense) => {
      const existing = acc.find((item) => item.category === expense.category)
      if (existing) {
        existing.amount += expense.amount
      } else {
        acc.push({ category: expense.category, amount: expense.amount })
      }
      return acc
    },
    [] as Array<{ category: string; amount: number }>
  )

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
          <h1 className="text-3xl font-bold text-white">Profit & Loss Report</h1>
          <p className="text-slate-400 mt-2">Comprehensive business analysis and financial reports</p>
        </div>

        {/* Date Filter */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 flex-col sm:flex-row items-end">
              <div className="flex-1">
                <Label className="text-slate-300 text-sm">From Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-slate-300 text-sm">To Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-900/30 to-slate-800/50 border-green-700/30">
            <CardContent className="p-6">
              <p className="text-green-300 text-sm mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">₦{totalSales.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">{sales.length} sales</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-700/30">
            <CardContent className="p-6">
              <p className="text-red-300 text-sm mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">₦{totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">{expenses.length} entries</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 border-blue-700/30">
            <CardContent className="p-6">
              <p className="text-blue-300 text-sm mb-2">Net Profit</p>
              <p className="text-2xl font-bold text-blue-400">₦{profit.toLocaleString()}</p>
              <p className={`text-xs mt-2 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitMargin}% margin
              </p>
            </CardContent>
          </Card>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-blue-700/50 transition">
                <CardContent className="p-6 h-full flex items-center justify-center">
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Record an Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Date</Label>
                  <Input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded mt-1 px-3 py-2"
                  >
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Amount (₦) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="0.00"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Record Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="category" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">
                  No expense data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expense Details */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="space-y-2">
                {expenseByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                    <span className="text-slate-300">{item.category}</span>
                    <span className="font-semibold text-white">₦{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No expenses recorded</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
