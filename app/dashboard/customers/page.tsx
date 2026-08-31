'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addCustomer, deleteCustomer, getBusiness, getCustomers, getSales, updateCustomer } from '@/app/actions/business'
import { Edit2, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', notes: '' })

export default function CustomersPage() {
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
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
      const [customerResult, salesResult] = await Promise.all([
        getCustomers(businessData.id),
        getSales(businessData.id),
      ])
      setCustomers(customerResult.data || [])
      setSales(salesResult.data || [])
    } catch (error) {
      console.error('[Customers] Error:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (customer?: any) => {
    if (customer) {
      setEditingId(customer.id)
      setFormData({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '', notes: customer.notes || '' })
    } else {
      setEditingId(null)
      setFormData(emptyForm())
    }
    setDialogOpen(true)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingRef.current) return
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required')
      return
    }
    savingRef.current = true
    setSaving(true)
    try {
      const result = editingId
        ? await updateCustomer(business.id, editingId, formData)
        : await addCustomer(business.id, formData)
      if (result.success) {
        toast.success(editingId ? 'Customer updated successfully!' : 'Customer added successfully!')
        setDialogOpen(false)
        await loadData()
      } else {
        toast.error(result.error)
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const handleDelete = async (customer: any) => {
    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) return
    const result = await deleteCustomer(business.id, customer.id)
    if (result.success) {
      toast.success('Customer deleted successfully!')
      await loadData()
    } else {
      toast.error(result.error)
    }
  }

  const customerRows = customers.map((customer) => {
    const customerSales = sales.filter((sale) => Number(sale.customer) === Number(customer.id) || Number(sale.customer_id) === Number(customer.id))
    const totalSpend = customerSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const orderCount = customerSales.length
    const lastPurchase = customerSales.length
      ? new Date(Math.max(...customerSales.map((sale) => new Date(sale.sold_at).getTime()))).toLocaleDateString()
      : 'No purchase yet'
    const isRepeatCustomer = orderCount > 1

    return { ...customer, totalSpend, orderCount, lastPurchase, isRepeatCustomer }
  })

  const repeatCustomers = customerRows.filter((customer) => customer.isRepeatCustomer).length
  const totalCustomerSpend = customerRows.reduce((sum, customer) => sum + customer.totalSpend, 0)

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div><h1 className="font-display text-3xl font-semibold text-ink">Customers</h1><p className="mt-2 text-text-secondary">Keep your customer relationships easy to find and follow up.</p></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button onClick={() => openDialog()} className="dashboard-primary"><Plus className="mr-2 h-4 w-4" />Add Customer</Button></DialogTrigger>
            <DialogContent className="dashboard-panel"><DialogHeader><DialogTitle className="font-display text-ink">{editingId ? 'Edit customer' : 'Add a customer'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div><Label className="text-text-secondary">Name *</Label><Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="dashboard-input mt-1" placeholder="Customer name" required /></div>
                <div><Label className="text-text-secondary">Phone *</Label><Input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className="dashboard-input mt-1" placeholder="Phone number" required /></div>
                <div><Label className="text-text-secondary">Email</Label><Input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="dashboard-input mt-1" placeholder="Email address" /></div>
                <div><Label className="text-text-secondary">Address</Label><Input value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} className="dashboard-input mt-1" placeholder="Address" /></div>
                <div><Label className="text-text-secondary">Notes</Label><Input value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className="dashboard-input mt-1" placeholder="Optional notes" /></div>
                <LoadingButton type="submit" loading={saving} className="dashboard-primary w-full">{editingId ? 'Update Customer' : 'Add Customer'}</LoadingButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="dashboard-panel">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Customers</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">{customerRows.length}</p>
              <p className="mt-2 text-sm text-text-secondary">Active profiles</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Repeat buyers</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-positive">{repeatCustomers}</p>
              <p className="mt-2 text-sm text-text-secondary">Bought more than once</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Customer spend</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">₦{totalCustomerSpend.toLocaleString()}</p>
              <p className="mt-2 text-sm text-text-secondary">Across confirmed purchases</p>
            </CardContent>
          </Card>
        </div>

        <Card className="dashboard-panel"><CardHeader><CardTitle className="font-display text-ink">Customer list</CardTitle></CardHeader><CardContent>{customerRows.length ? <div className="overflow-x-auto"><table className="dashboard-table w-full text-sm text-text-secondary"><thead><tr className="border-b border-border"><th className="px-4 py-3 text-left font-semibold">Name</th><th className="px-4 py-3 text-left font-semibold">Phone</th><th className="px-4 py-3 text-left font-semibold">Total spend</th><th className="px-4 py-3 text-left font-semibold">Orders</th><th className="px-4 py-3 text-left font-semibold">Last purchase</th><th className="px-4 py-3 text-left font-semibold">Action</th></tr></thead><tbody>{customerRows.map((customer) => <tr key={customer.id}><td className="px-4 py-3 font-medium text-ink">{customer.name}<div className="mt-1 text-[11px] text-text-muted">{customer.isRepeatCustomer ? 'Repeat buyer' : 'New buyer'}</div></td><td className="px-4 py-3">{customer.phone}</td><td className="px-4 py-3 font-mono text-ink">₦{customer.totalSpend.toLocaleString()}</td><td className="px-4 py-3">{customer.orderCount}</td><td className="px-4 py-3">{customer.lastPurchase}</td><td className="px-4 py-3"><div className="flex gap-1"><Button onClick={() => openDialog(customer)} size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" aria-label="Edit customer"><Edit2 className="h-4 w-4" /></Button><Button onClick={() => handleDelete(customer)} size="sm" variant="ghost" className="text-negative hover:bg-negative/10" aria-label="Delete customer">×</Button></div></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><Users className="h-8 w-8 text-blue" /><p>No customers yet. Add your first customer to start building your customer list.</p><Button onClick={() => openDialog()} className="dashboard-primary">Add your first customer</Button></div>}</CardContent></Card>
      </main>
    </div>
  )
}
