'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { BarChart3, Download, Plus, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getSales, getExpenses, addExpense } from '@/app/actions/business'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const padNumber = (value: number) => String(value).padStart(2, '0')

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseReportDate(value: unknown) {
  if (!value) return null

  const raw = String(value)
  if (raw.includes('T')) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(`${raw}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

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
        await loadData()
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

  const normalizedSales = useMemo(
    () =>
      sales.map((sale) => {
        const date = parseReportDate(sale.sold_at ?? sale.sale_date ?? sale.date ?? sale.created_at)
        const amount = toNumber(sale.total ?? sale.total_amount ?? sale.amount ?? 0)

        return {
          ...sale,
          saleDate: date,
          total_amount: amount,
          sale_date: date ? `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}` : '',
        }
      }),
    [sales],
  )

  const normalizedExpenses = useMemo(
    () =>
      expenses.map((expense) => {
        const date = parseReportDate(expense.date ?? expense.expense_date ?? expense.created_at)
        const amount = toNumber(expense.amount ?? 0)

        return {
          ...expense,
          expenseDate: date,
          amount,
          expense_date: date ? `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}` : '',
        }
      }),
    [expenses],
  )

  const totalSales = normalizedSales.reduce((sum, sale) => sum + toNumber(sale.total_amount), 0)
  const totalExpenses = normalizedExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)
  const profit = totalSales - totalExpenses
  const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0
  const totalOrders = normalizedSales.length
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; expenses: number }>()

    normalizedSales.forEach((sale) => {
      const dateValue = sale.saleDate ? sale.saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
      const current = map.get(dateValue) ?? { date: dateValue, revenue: 0, expenses: 0 }
      current.revenue += toNumber(sale.total_amount)
      map.set(dateValue, current)
    })

    normalizedExpenses.forEach((expense) => {
      const dateValue = expense.expenseDate ? expense.expenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'
      const current = map.get(dateValue) ?? { date: dateValue, revenue: 0, expenses: 0 }
      current.expenses += toNumber(expense.amount)
      map.set(dateValue, current)
    })

    return [...map.values()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [normalizedSales, normalizedExpenses])

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    normalizedExpenses.forEach((expense) => {
      const key = String(expense.category || 'Other')
      map.set(key, (map.get(key) ?? 0) + toNumber(expense.amount))
    })
    return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
  }, [normalizedExpenses])

  const revenueByProduct = useMemo(() => {
    const map = new Map<string, number>()
    normalizedSales.forEach((sale) => {
      const key = String(sale.product_name || 'Product')
      map.set(key, (map.get(key) ?? 0) + toNumber(sale.total_amount))
    })
    return [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [normalizedSales])

  const topExpenseCategory = expenseByCategory[0]

  const handleDownloadPdf = () => {
    if (!business) return

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const innerWidth = pageWidth - margin * 2
    const primary = [15, 23, 42]
    const accent = [59, 130, 246]
    const emerald = [16, 185, 129]
    const red = [239, 68, 68]
    const amber = [245, 158, 11]
    const slate = [148, 163, 184]
    const paper = [248, 250, 252]
    const soft = [241, 245, 249]

    const businessName = String(business.name || business.business_name || 'Business Report')
    const fileName = `${businessName.replace(/\s+/g, '-').toLowerCase()}-profit-loss-report.pdf`

    doc.setFillColor(paper[0], paper[1], paper[2])
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setFillColor(primary[0], primary[1], primary[2])
    doc.rect(0, 0, pageWidth, 44, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(businessName, margin, 19)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Profit & Loss Report', margin, 28)
    doc.text(`${dateRange.start || '—'} to ${dateRange.end || '—'}`, margin, 35)

    const badgeX = pageWidth - margin - 44
    doc.setFillColor(59, 130, 246)
    doc.roundedRect(badgeX, 14, 38, 14, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('LIVE', badgeX + 11, 23)

    const metrics = [
      { label: 'Revenue', value: formatCurrency(totalSales), color: emerald, fill: [220, 252, 231] },
      { label: 'Expenses', value: formatCurrency(totalExpenses), color: red, fill: [254, 226, 226] },
      { label: 'Net Profit', value: formatCurrency(profit), color: accent, fill: [219, 234, 254] },
      { label: 'Margin', value: `${profitMargin.toFixed(1)}%`, color: amber, fill: [254, 243, 199] },
    ]

    metrics.forEach((metric, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = margin + col * (innerWidth / 2 + 4)
      const y = 52 + row * 24
      const boxWidth = innerWidth / 2 - 2

      doc.setFillColor(metric.fill[0], metric.fill[1], metric.fill[2])
      doc.roundedRect(x, y, boxWidth, 18, 2.5, 2.5, 'F')
      doc.setDrawColor(metric.color[0], metric.color[1], metric.color[2])
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, boxWidth, 18, 2.5, 2.5, 'S')
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(metric.label, x + 5, y + 7)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(metric.value, x + 5, y + 14)
    })

    let yPosition = 105

    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, yPosition, innerWidth, 42, 3, 3, 'F')
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Business details', margin + 6, yPosition + 8)
    doc.setTextColor(...slate)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const detailLines = [
      `Business: ${businessName}`,
      `Email: ${business.email || business.business_email || 'Not available'}`,
      `Phone: ${business.phone || business.business_phone || 'Not available'}`,
      `Address: ${business.address || business.business_address || 'Not available'}`,
    ]
    detailLines.forEach((line, index) => {
      doc.text(line, margin + 6, yPosition + 16 + index * 7)
    })

    yPosition = 156
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, yPosition, innerWidth, 52, 3, 3, 'F')
    doc.setTextColor(primary[0], primary[1], primary[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Expense categories', margin + 6, yPosition + 8)

    const categoryTotal = expenseByCategory.reduce((sum, item) => sum + item.amount, 0) || 1
    doc.setTextColor(slate[0], slate[1], slate[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    expenseByCategory.slice(0, 4).forEach((item, index) => {
      const rowY = yPosition + 15 + index * 10
      const width = (item.amount / categoryTotal) * 90
      doc.setFillColor(amber[0], amber[1], amber[2])
      doc.roundedRect(margin + 6, rowY + 2, 90, 4, 1.5, 1.5, 'F')
      doc.setFillColor(230, 230, 230)
      doc.roundedRect(margin + 6, rowY + 2, 90, 4, 1.5, 1.5, 'S')
      doc.setFillColor(amber[0], amber[1], amber[2])
      doc.roundedRect(margin + 6, rowY + 2, width, 4, 1.5, 1.5, 'F')
      doc.text(`${item.category}`, margin + 6, rowY - 1)
      doc.text(formatCurrency(item.amount), pageWidth - margin - 26, rowY - 1)
    })

    if (doc.internal.pageSize.getHeight() > 0) {
      doc.addPage()
    }

    const secondPageStart = 18
    doc.setFillColor(paper[0], paper[1], paper[2])
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setFillColor(primary[0], primary[1], primary[2])
    doc.rect(0, 0, pageWidth, 26, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Business performance', margin, 17)

    doc.setTextColor(...primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Top revenue products', margin, secondPageStart + 20)

    const productBars = revenueByProduct.length ? revenueByProduct : [{ name: 'No sales yet', amount: 0 }]
    const maxProductValue = Math.max(...productBars.map((item) => item.amount), 1)
    productBars.forEach((item, index) => {
      const rowY = secondPageStart + 28 + index * 18
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, rowY, innerWidth, 12, 2, 2, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, rowY, innerWidth, 12, 2, 2, 'S')
      doc.setFillColor(emerald[0], emerald[1], emerald[2])
      doc.roundedRect(margin + 1, rowY + 2, ((item.amount || 0) / maxProductValue) * (innerWidth - 2), 8, 2, 2, 'F')
      doc.setTextColor(primary[0], primary[1], primary[2])
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`${index + 1}. ${item.name}`, margin + 4, rowY + 8)
      doc.text(formatCurrency(item.amount || 0), pageWidth - margin - 25, rowY + 8)
    })

    const summaryY = secondPageStart + 28 + Math.max(productBars.length, 4) * 18 + 12
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, summaryY, innerWidth, 30, 3, 3, 'F')
    doc.setTextColor(...primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Summary', margin + 6, summaryY + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Sales recorded: ${totalOrders}`, margin + 6, summaryY + 18)
    doc.text(`Average order value: ${formatCurrency(averageOrderValue)}`, margin + 6, summaryY + 25)
    doc.text(`Highest cost area: ${topExpenseCategory ? topExpenseCategory.category : 'N/A'}`, margin + 90, summaryY + 18)
    doc.text(`Health status: ${profit >= 0 ? 'Profitable' : 'Needs attention'}`, margin + 90, summaryY + 25)

    doc.setTextColor(slate[0], slate[1], slate[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Generated on ${new Date().toLocaleDateString()} • ${businessName}`, margin, pageHeight - 10)

    doc.save(fileName)
  }

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center">
        <PageSkeleton rows={4} />
      </div>
    )
  }

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Business overview</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Profit & loss report</h1>
            <p className="mt-2 text-text-secondary">
              {business?.name || business?.business_name || 'Your business'} · {dateRange.start} to {dateRange.end}
            </p>
          </div>

          <Button onClick={handleDownloadPdf} className="dashboard-primary self-start md:self-auto">
            <Download className="mr-2 h-4 w-4" />
            Download PDF report
          </Button>
        </div>

        <Card className="dashboard-panel mb-8">
          <CardContent className="p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-text-secondary text-sm">From date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="dashboard-input mt-1"
                />
              </div>
              <div>
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

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-slate-950 text-slate-50 shadow-lg shadow-emerald-950/20">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-emerald-300">Total revenue</p>
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalSales)}</p>
              <p className="mt-2 text-xs text-slate-300">{totalOrders} sales recorded</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/15 to-slate-950 text-slate-50 shadow-lg shadow-red-950/20">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-red-300">Total expenses</p>
                <TrendingDown className="h-4 w-4 text-red-300" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
              <p className="mt-2 text-xs text-slate-300">{expenseByCategory.length} categories</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-slate-950 text-slate-50 shadow-lg shadow-blue-950/20">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-blue-300">Net profit</p>
                <Wallet className="h-4 w-4 text-blue-300" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(profit)}</p>
              <p className={`mt-2 text-xs ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-slate-950 text-slate-50 shadow-lg shadow-amber-950/20">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-amber-300">Average order</p>
                <BarChart3 className="h-4 w-4 text-amber-300" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(averageOrderValue)}</p>
              <p className="mt-2 text-xs text-slate-300">{topExpenseCategory ? `${topExpenseCategory.category} is highest cost` : 'No expense category yet'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="font-display text-ink">Revenue vs expenses trend</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(Number(value))}
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: 12 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty">
                  <BarChart3 className="h-8 w-8 text-blue" />
                  No sales or expense data for this period. Adjust the date range or add your first transaction.
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
                    <XAxis dataKey="category" stroke="#94a3b8" angle={-30} textAnchor="end" height={70} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(Number(value))}
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: 12 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty">
                  <Receipt className="h-8 w-8 text-blue" />
                  No expense categories yet. Add an expense to see where your money is going.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="font-display text-ink">Top revenue products</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByProduct.length > 0 ? (
                <div className="space-y-3">
                  {revenueByProduct.map((item, index) => (
                    <div key={item.name} className="rounded-xl border border-border bg-surface/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-text-secondary">#{index + 1} {item.name}</span>
                        <span className="font-semibold text-ink">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                          style={{ width: `${Math.max(18, (item.amount / (revenueByProduct[0]?.amount || item.amount)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <BarChart3 className="h-8 w-8 text-blue" />
                  No sales have been recorded in this range yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-panel">
            <CardHeader>
              <CardTitle className="font-display text-ink">Expense detail</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <div className="space-y-3">
                  {expenseByCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between rounded-lg border-b border-border pb-3 last:border-b-0 last:pb-0">
                      <span className="text-text-secondary">{item.category}</span>
                      <span className="font-semibold text-ink">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <Receipt className="h-8 w-8 text-blue" />
                  Add an expense to see daily cost details.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Quick notes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-sm text-text-muted">Revenue generated</p>
              <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(totalSales)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-sm text-text-muted">Operating cost</p>
              <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-sm text-text-muted">Business health</p>
              <p className={`mt-2 text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {profit >= 0 ? 'Profitable' : 'Needs attention'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <div className="mt-8 flex justify-center md:hidden">
              <Button className="dashboard-primary w-full max-w-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add expense
              </Button>
            </div>
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
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="dashboard-input mt-1"
                />
              </div>
              <div>
                <Label className="text-text-secondary">Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="dashboard-input mt-1"
                  placeholder="0.00"
                  required
                />
              </div>
              <LoadingButton type="submit" loading={savingExpense} className="dashboard-primary w-full">
                {savingExpense ? 'Saving...' : 'Record Expense'}
              </LoadingButton>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
