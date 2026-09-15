'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileText, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { getBusiness, getInvoices } from '@/app/actions/business'
import { PageSkeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Invoice {
  id: number
  doc_type: 'receipt' | 'invoice'
  doc_number: string
  customer_name?: string
  status: 'paid' | 'unpaid' | 'partial'
  issue_date: string
  due_date?: string
  total: string | number
}

export default function InvoicesPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'receipt' | 'invoice'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all')

  useEffect(() => {
    setLoading(true)
    setLoadError('')
    getBusiness()
      .then(async (businessResult) => {
        if (!businessResult) return
        setBusiness(businessResult)

        const result = await getInvoices(
          businessResult.id,
          docTypeFilter === 'all' ? undefined : docTypeFilter,
          statusFilter === 'all' ? undefined : statusFilter
        )

        if (result.success) {
          // Sort by issue_date descending
          const sorted = (result.data || []).sort(
            (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
          )
          setInvoices(sorted)
        } else {
          setLoadError('error' in result ? result.error : 'Unable to load invoices.')
        }
      })
      .catch(() => setLoadError('Unable to load invoices. Try again.'))
      .finally(() => setLoading(false))
  }, [docTypeFilter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'unpaid':
        return 'bg-red-100 text-red-700'
      case 'partial':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatMoney = (value: string | number) => {
    return `₦${Number(value).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (loading) {
    return (
      <main className="dashboard-page md:pl-8">
        <div className="mx-auto max-w-6xl flex items-center justify-center py-12 text-text-secondary">
          <PageSkeleton rows={5} />
        </div>
      </main>
    )
  }

  if (loadError) {
    return <main className="dashboard-page md:pl-8"><div className="mx-auto max-w-6xl rounded-xl border border-negative/20 bg-surface p-6 shadow-[var(--shadow-card)]" role="alert"><p className="font-semibold text-negative">We could not load your invoices.</p><p className="mt-2 text-sm text-text-secondary">{loadError}</p></div></main>
  }

  return (
    <main className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Invoices & Receipts</h1>
            <p className="mt-1 text-sm text-text-secondary">Manage your invoices and receipts</p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>

        {/* Filters */}
        <div className="dashboard-panel mb-6 flex flex-col gap-4 p-4 sm:flex-row">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Document Type</label>
            <Select value={docTypeFilter} onValueChange={(value) => setDocTypeFilter(value as typeof docTypeFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="receipt">Receipts</SelectItem><SelectItem value="invoice">Invoices</SelectItem></SelectContent></Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent></Select>
          </div>
        </div>

        {/* List */}
        {invoices.length === 0 ? (
          <div className="dashboard-panel p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-text-secondary font-medium">No invoices or receipts yet</p>
            <p className="text-sm text-text-muted mt-1">Create your first invoice to get started</p>
            <Link
              href="/dashboard/invoices/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="dashboard-panel overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Document</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Issue Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-primary">Due Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-text-primary">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-primary">Status</th>
                      <th className="sticky right-0 bg-bg px-4 py-3 text-right font-semibold text-text-primary">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{invoice.doc_number}</div>
                      <div className="text-xs text-text-muted uppercase">{invoice.doc_type}</div>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{invoice.customer_name || 'Walk-in'}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(invoice.issue_date)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                    </td>
                    <td className="sticky right-0 bg-surface px-4 py-3 text-right">
                      <div className="dashboard-number font-semibold text-text-primary">{formatMoney(invoice.total)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/receipts/${invoice.id}`}
                        className="inline-flex items-center gap-2 text-blue font-semibold hover:text-blue/80"
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
