'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { addCustomer, deleteCustomer, getBusiness, getCustomerReminders, getCustomers, getInvoices, getSales, updateCustomer } from '@/app/actions/business'
import { AlertTriangle, CalendarDays, CreditCard, DollarSign, Edit2, Eye, Plus, UserRound, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', notes: '' })
const segmentOrder = ['all', 'New', 'Repeat', 'At risk', 'Inactive', 'Top spender', 'owing'] as const

type SegmentFilter = (typeof segmentOrder)[number]

const segmentClasses: Record<string, string> = {
  New: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Repeat: 'border-sky-200 bg-sky-50 text-sky-700',
  'At risk': 'border-amber-200 bg-amber-50 text-amber-700',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-700',
  'Top spender': 'border-violet-200 bg-violet-50 text-violet-700',
  owing: 'border-red-200 bg-red-50 text-red-700',
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'No purchase yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No purchase yet'
  return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CustomersPage() {
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [filter, setFilter] = useState<SegmentFilter>('all')
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
        window.location.href = '/dashboard'
        return
      }
      setBusiness(businessData)
      const [customerResult, salesResult, invoiceResult, reminderResult] = await Promise.all([
        getCustomers(businessData.id),
        getSales(businessData.id),
        getInvoices(businessData.id),
        getCustomerReminders(businessData.id),
      ])
      setCustomers(customerResult.data || [])
      setSales(salesResult.data || [])
      setInvoices(invoiceResult.data || [])
      setReminders(reminderResult.data || [])
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

  const openDetail = (customer: any) => {
    setSelectedCustomer(customer)
    setDetailOpen(true)
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

  const visibleCustomers = customers.filter((customer) => {
    if (filter === 'all') return true
    if (filter === 'owing') return Number(customer.owing_amount || 0) > 0
    return customer.segment === filter
  })

  const atRiskCustomers = customers.filter((customer) => customer.segment === 'At risk').length
  const owingCustomers = customers.filter((customer) => Number(customer.owing_amount || 0) > 0).length
  const totalCustomerSpend = customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0)
  const recentReminders = reminders.slice(0, 4)

  const selectedCustomerSales = selectedCustomer
    ? sales.filter((sale) => Number(sale.customer) === Number(selectedCustomer.id) || Number(sale.customer_id) === Number(selectedCustomer.id))
    : []

  const selectedCustomerInvoices = selectedCustomer
    ? invoices.filter((invoice) => Number(invoice.customer) === Number(selectedCustomer.id) || Number(invoice.customer_id) === Number(selectedCustomer.id))
    : []

  const unpaidInvoices = selectedCustomerInvoices.filter((invoice) => invoice.status === 'unpaid' || invoice.doc_type === 'invoice' && invoice.status === 'unpaid')

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Customer CRM</h1>
            <p className="mt-2 text-text-secondary">Track buying habits, unpaid balances, and who needs outreach next.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="dashboard-primary"><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
            </DialogTrigger>
            <DialogContent className="dashboard-panel">
              <DialogHeader>
                <DialogTitle className="font-display text-ink">{editingId ? 'Edit customer' : 'Add a customer'}</DialogTitle>
              </DialogHeader>
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
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">{customers.length}</p>
              <p className="mt-2 text-sm text-text-secondary">Active profiles</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">At risk</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-amber-600">{atRiskCustomers}</p>
              <p className="mt-2 text-sm text-text-secondary">Past 30–60 days</p>
            </CardContent>
          </Card>
          <Card className="dashboard-panel">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Customer spend</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">{formatCurrency(totalCustomerSpend)}</p>
              <p className="mt-2 text-sm text-text-secondary">Across all purchases</p>
            </CardContent>
          </Card>
        </div>

        <Card className="dashboard-panel mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {segmentOrder.map((segment) => {
                const isActive = filter === segment
                const isOwing = segment === 'owing'
                const count = segment === 'all'
                  ? customers.length
                  : segment === 'owing'
                    ? owingCustomers
                    : customers.filter((customer) => customer.segment === segment).length

                return (
                  <button
                    key={segment}
                    type="button"
                    onClick={() => setFilter(segment)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${isActive ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-border bg-surface text-text-secondary hover:border-blue-200 hover:text-blue-700'} ${isOwing ? 'border-red-200 bg-red-50 text-red-700' : ''}`}
                  >
                    <span>{segment === 'all' ? 'All' : segment === 'owing' ? 'Owes money' : segment}</span>
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-xs">{count}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel mb-6">
          <CardHeader>
            <CardTitle className="font-display text-ink">Recent reminder activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReminders.length ? (
              <div className="space-y-3">
                {recentReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
                    <div>
                      <div className="font-medium text-ink">{reminder.customer_name || 'Customer'}</div>
                      <div className="text-xs text-text-secondary">{reminder.reminder_type === 'payment' ? 'Payment reminder' : 'Re-engagement reminder'} · {reminder.subject}</div>
                    </div>
                    <div className="text-right text-xs text-text-secondary">
                      <div>{new Date(reminder.sent_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div>{new Date(reminder.sent_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No reminder emails have been sent yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Customer list</CardTitle>
          </CardHeader>
          <CardContent>
            {visibleCustomers.length ? (
              <div className="overflow-x-auto">
                <table className="dashboard-table w-full text-sm text-text-secondary">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold">Segment</th>
                      <th className="px-4 py-3 text-left font-semibold">Total spent</th>
                      <th className="px-4 py-3 text-left font-semibold">Owing</th>
                      <th className="px-4 py-3 text-left font-semibold">Last purchase</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{customer.name}</div>
                          <div className="mt-1 text-[11px] text-text-muted">{customer.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={segmentClasses[customer.segment] || 'border-border bg-surface text-text-secondary'}>{customer.segment}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-ink">{formatCurrency(customer.total_spent || 0)}</td>
                        <td className="px-4 py-3 font-mono text-ink">
                          {Number(customer.owing_amount || 0) > 0 ? formatCurrency(customer.owing_amount) : '—'}
                        </td>
                        <td className="px-4 py-3">{formatDate(customer.last_purchase_date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button onClick={() => openDetail(customer)} size="sm" variant="outline" className="gap-1">
                              <Eye className="h-4 w-4" />Detail
                            </Button>
                            <Button onClick={() => openDialog(customer)} size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" aria-label="Edit customer"><Edit2 className="h-4 w-4" /></Button>
                            <Button onClick={() => handleDelete(customer)} size="sm" variant="ghost" className="text-negative hover:bg-negative/10" aria-label="Delete customer">×</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dashboard-empty">
                <Users className="h-8 w-8 text-blue" />
                <p>No customers match this filter yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="dashboard-panel max-w-4xl">
            {selectedCustomer && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-ink">{selectedCustomer.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted"><UserRound className="h-4 w-4" />Customer</div>
                    <p className="mt-3 text-lg font-semibold text-ink">{selectedCustomer.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{selectedCustomer.phone}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted"><DollarSign className="h-4 w-4" />Spend</div>
                    <p className="mt-3 text-lg font-semibold text-ink">{formatCurrency(selectedCustomer.total_spent || 0)}</p>
                    <p className="mt-1 text-sm text-text-secondary">{selectedCustomer.order_count || 0} orders</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted"><CreditCard className="h-4 w-4" />Balance</div>
                    <p className="mt-3 text-lg font-semibold text-ink">{formatCurrency(selectedCustomer.owing_amount || 0)}</p>
                    <p className="mt-1 text-sm text-text-secondary">{Number(selectedCustomer.owing_amount || 0) > 0 ? 'Unpaid invoices' : 'No outstanding invoices'}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><CalendarDays className="h-4 w-4" />Purchase history</div>
                    {selectedCustomerSales.length ? (
                      <div className="space-y-3">
                        {selectedCustomerSales.map((sale) => (
                          <div key={sale.id} className="rounded-xl border border-border bg-surface p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-ink">{sale.product_name}</div>
                              <div className="font-mono text-ink">{formatCurrency(sale.total)}</div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
                              <span>{formatDate(sale.sold_at)}</span>
                              <span className="uppercase">{sale.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">No purchase history yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><AlertTriangle className="h-4 w-4" />Unpaid invoices</div>
                    {unpaidInvoices.length ? (
                      <div className="space-y-3">
                        {unpaidInvoices.map((invoice) => (
                          <div key={invoice.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-red-700">{invoice.doc_number}</div>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-700">{invoice.status}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-red-700/80">
                              <span>{invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}</span>
                              <span className="font-mono">{formatCurrency(invoice.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">No unpaid invoices for this customer.</div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><CalendarDays className="h-4 w-4" />Reminder history</div>
                  {reminders.filter((reminder) => Number(reminder.customer_id) === Number(selectedCustomer.id)).length ? (
                    <div className="space-y-3">
                      {reminders.filter((reminder) => Number(reminder.customer_id) === Number(selectedCustomer.id)).map((reminder) => (
                        <div key={reminder.id} className="rounded-xl border border-border bg-surface p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-ink">{reminder.subject}</div>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">{reminder.reminder_type}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
                            <span>{reminder.email || 'No email stored'}</span>
                            <span>{new Date(reminder.sent_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">No reminder emails sent to this customer yet.</div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
