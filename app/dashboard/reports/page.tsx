'use client'

import React from "react"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getSales, getExpenses, addExpense } from '@/app/actions/business'
import { BarChart3, Plus, Download, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ReportsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const savingExpenseRef = useRef(false)
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
    if (savingExpenseRef.current) return

    if (!formData.category || formData.amount <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    savingExpenseRef.current = true
    setSavingExpense(true)
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
    } finally {
      savingExpenseRef.current = false
      setSavingExpense(false)
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
      const existing = acc.find((item: { date: string; revenue: number; expenses: number }) => item.date === date)
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
    const existing = dailyData.find((item: { date: string; revenue: number; expenses: number }) => item.date === date)
    if (existing) {
      existing.expenses += expense.amount
    } else {
      dailyData.push({ date, revenue: 0, expenses: expense.amount })
    }
  })

  // Sort by date
  dailyData.sort((a: { date: string; revenue: number; expenses: number }, b: { date: string; revenue: number; expenses: number }) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Expense breakdown
  const expenseByCategory = expenses.reduce(
    (acc, expense) => {
      const existing = acc.find((item: { category: string; amount: number }) => item.category === expense.category)
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
      <div className="dashboard-page flex items-center justify-center">
        <div className="text-text-secondary">Loading your reports...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink">Profit & loss</h1>
          <p className="text-text-secondary mt-2">Turn sales and expense records into decisions you can act on.</p>
        </div>

        {/* Date Filter */}
        <Card className="dashboard-panel mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4 flex-col sm:flex-row items-end">
              <div className="flex-1">
                <Label className="text-text-secondary text-sm">From date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="dashboard-input mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-text-secondary text-sm">To date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="dashboard-input mt-1"
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
              <p className="text-xs text-text-muted mt-2">{sales.length} sales</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-700/30">
            <CardContent className="p-6">
              <p className="text-red-300 text-sm mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">₦{totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-2">{expenses.length} entries</p>
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
              <Card className="dashboard-panel">
                <CardContent className="p-6 h-full flex items-center justify-center">
                  <Button className="dashboard-primary w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="dashboard-panel">
              <DialogHeader>
                <DialogTitle className="font-display text-ink">Record an expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <Label className="text-text-secondary">Date</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    className="dashboard-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-text-secondary">Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="dashboard-input mt-1 w-full px-3 py-2"
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
                  <Label className="text-text-secondary">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="dashboard-input mt-1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-text-secondary">Amount (N) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) })
                    }
                    className="dashboard-input mt-1"
                    placeholder="0.00"
                    required
                  />
                </div>
                <Button type="submit" disabled={savingExpense} className="dashboard-primary w-full">
                  {savingExpense ? 'Saving...' : 'Record Expense'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="font-display text-ink">Revenue vs expenses</CardTitle>
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
                <div className="dashboard-empty">
                  <BarChart3 className="h-8 w-8 text-blue" />
                  No sales or expense data for this period. Adjust the dates or record your first transaction.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="font-display text-ink">Expense breakdown</CardTitle>
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
                <div className="dashboard-empty">
                  <Receipt className="h-8 w-8 text-blue" />
                  No expenses in this period. Record an expense to understand where your money is going.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expense Details */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Expense details</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="space-y-2">
                {expenseByCategory.map((item: { category: string; amount: number }) => (
                  <div key={item.category} className="flex items-center justify-between rounded-lg border-b border-border p-4 hover:bg-blue/5">
                    <span className="text-text-secondary">{item.category}</span>
                    <span className="dashboard-number font-semibold text-ink">N{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty"><Receipt className="h-8 w-8 text-blue" /><p>No expenses yet. Record your first expense to see the cost of running your business.</p><Button onClick={() => setDialogOpen(true)} className="dashboard-primary">Record your first expense</Button></div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
