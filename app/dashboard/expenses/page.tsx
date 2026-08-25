'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addExpense, deleteExpense, getBusiness, getExpenses, updateExpense } from '@/app/actions/business'
import { Edit2, Plus, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const emptyForm = () => ({
  expense_date: new Date().toISOString().split('T')[0],
  category: 'Other',
  description: '',
  amount: 0,
  payment_method: 'cash',
})

export default function ExpensesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard/setup'
        return
      }
      setBusiness(businessData)
      const result = await getExpenses(businessData.id)
      setExpenses(result.data || [])
    } catch (error) {
      console.error('[Expenses] Error:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (expense?: any) => {
    if (expense) {
      setEditingId(expense.id)
      setFormData({
        expense_date: expense.expense_date,
        category: expense.category,
        description: expense.description || '',
        amount: Number(expense.amount) || 0,
        payment_method: expense.payment_method || 'cash',
      })
    } else {
      setEditingId(null)
      setFormData(emptyForm())
    }
    setDialogOpen(true)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.category || formData.amount <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    const result = editingId
      ? await updateExpense(business.id, editingId, formData)
      : await addExpense(business.id, formData)
    if (result.success) {
      toast.success(editingId ? 'Expense updated successfully!' : 'Expense recorded successfully!')
      setDialogOpen(false)
      await loadData()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (expense: any) => {
    if (!window.confirm(`Delete this ${expense.category.toLowerCase()} expense? This cannot be undone.`)) return
    const result = await deleteExpense(business.id, expense.id)
    if (result.success) {
      toast.success('Expense deleted successfully!')
      await loadData()
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return <div className="dashboard-page flex items-center justify-center"><div className="text-text-secondary">Loading your expenses...</div></div>
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Expenses</h1>
            <p className="mt-2 text-text-secondary">Keep every business cost visible so your profit stays honest.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button onClick={() => openDialog()} className="dashboard-primary"><Plus className="mr-2 h-4 w-4" />Add Expense</Button></DialogTrigger>
            <DialogContent className="dashboard-panel">
              <DialogHeader><DialogTitle className="font-display text-ink">{editingId ? 'Edit expense' : 'Record an expense'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div><Label className="text-text-secondary">Date</Label><Input type="date" value={formData.expense_date} onChange={(event) => setFormData({ ...formData, expense_date: event.target.value })} className="dashboard-input mt-1" required /></div>
                <div><Label className="text-text-secondary">Category *</Label><select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="dashboard-input mt-1 w-full px-3 py-2"><option>Rent</option><option>Utilities</option><option>Salaries</option><option>Transportation</option><option>Supplies</option><option>Marketing</option><option>Maintenance</option><option>Insurance</option><option>Other</option></select></div>
                <div><Label className="text-text-secondary">Description</Label><Input value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="dashboard-input mt-1" placeholder="Optional" /></div>
                <div><Label className="text-text-secondary">Amount (₦) *</Label><Input type="number" min="0" step="0.01" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: parseFloat(event.target.value) || 0 })} className="dashboard-input mt-1" required /></div>
                <div><Label className="text-text-secondary">Payment method</Label><select value={formData.payment_method} onChange={(event) => setFormData({ ...formData, payment_method: event.target.value })} className="dashboard-input mt-1 w-full px-3 py-2"><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option><option value="cheque">Cheque</option></select></div>
                <Button type="submit" className="dashboard-primary w-full">{editingId ? 'Update Expense' : 'Record Expense'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="dashboard-panel"><CardContent className="p-6"><p className="mb-2 text-sm text-text-secondary">Total expenses</p><p className="dashboard-number text-2xl font-medium text-ink">₦{totalExpenses.toLocaleString()}</p><p className="mt-2 text-xs text-text-muted">{expenses.length} entries recorded</p></CardContent></Card>
          <Card className="dashboard-panel"><CardContent className="p-6"><p className="mb-2 text-sm text-text-secondary">Average expense</p><p className="dashboard-number text-2xl font-medium text-ink">₦{(expenses.length ? totalExpenses / expenses.length : 0).toLocaleString()}</p><p className="mt-2 text-xs text-text-muted">Per entry</p></CardContent></Card>
        </div>

        <Card className="dashboard-panel"><CardHeader><CardTitle className="font-display text-ink">Expense history</CardTitle></CardHeader><CardContent>{expenses.length ? <div className="overflow-x-auto"><table className="dashboard-table w-full text-sm text-text-secondary"><thead><tr className="border-b border-border"><th className="px-4 py-3 text-left font-semibold">Date</th><th className="px-4 py-3 text-left font-semibold">Category</th><th className="px-4 py-3 text-left font-semibold">Description</th><th className="px-4 py-3 text-right font-semibold">Amount</th><th className="px-4 py-3 text-left font-semibold">Method</th><th className="px-4 py-3 text-left font-semibold">Action</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td className="px-4 py-3">{new Date(expense.expense_date).toLocaleDateString()}</td><td className="px-4 py-3 font-medium text-ink">{expense.category}</td><td className="px-4 py-3">{expense.description || '-'}</td><td className="dashboard-number px-4 py-3 text-right font-semibold text-negative">₦{Number(expense.amount).toLocaleString()}</td><td className="px-4 py-3 text-xs"><span className="rounded bg-blue/10 px-2 py-1 text-blue">{expense.payment_method}</span></td><td className="px-4 py-3"><div className="flex gap-1"><Button onClick={() => openDialog(expense)} size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" aria-label="Edit expense"><Edit2 className="h-4 w-4" /></Button><Button onClick={() => handleDelete(expense)} size="sm" variant="ghost" className="text-negative hover:bg-negative/10" aria-label="Delete expense">×</Button></div></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><Receipt className="h-8 w-8 text-blue" /><p>No expenses yet. Record your first expense to start tracking the cost of running your business.</p><Button onClick={() => openDialog()} className="dashboard-primary">Record your first expense</Button></div>}</CardContent></Card>
      </main>
    </div>
  )
}
