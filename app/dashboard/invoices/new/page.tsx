'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { addCustomer, getBusiness, getCustomers, createInvoice, generateInvoiceNotes } from '@/app/actions/business'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageSkeleton } from '@/components/ui/skeleton'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

interface Customer {
  id: number
  name: string
  email?: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [customerOption, setCustomerOption] = useState<'existing' | 'new'>('existing')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0 },
  ])
  const [showAiInput, setShowAiInput] = useState(false)
  const [aiDescription, setAiDescription] = useState('')

  useEffect(() => {
    getBusiness()
      .then(async (businessResult) => {
        if (!businessResult) {
          setError('Business not found')
          return
        }
        setBusiness(businessResult)
        try {
          const customersResult = await getCustomers(businessResult.id)
          if (customersResult.success) setCustomers(customersResult.data)
        } catch {
          setCustomers([])
        }
      })
      .catch(() => setError('Failed to load business'))
      .finally(() => setLoading(false))
  }, [])

  const handleGenerateNotes = async () => {
    if (!aiDescription.trim() || !business) return

    setGenerating(true)
    try {
      const result = await generateInvoiceNotes(business.id, aiDescription)
      if (result.success) {
        // Replace line items with generated ones
        const newItems = (result.data.line_items || []).map((item: any, idx: number) => ({
          id: String(idx + 1),
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        }))
        if (newItems.length > 0) {
          setLineItems(newItems)
        }
        // Set notes if provided
        if (result.data.notes) {
          setNotes(result.data.notes)
        }
        setShowAiInput(false)
        setAiDescription('')
      } else {
        setError(result.error || 'Failed to generate invoice notes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate invoice notes')
    } finally {
      setGenerating(false)
    }
  }

  const addLineItem = () => {
    const newId = String(Math.max(...lineItems.map((i) => parseInt(i.id)), 0) + 1)
    setLineItems([...lineItems, { id: newId, description: '', quantity: 1, unit_price: 0 }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((i) => i.id !== id))
    }
  }

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'description' ? value : Number(value) || 0,
            }
          : item
      )
    )
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (savingRef.current) return
    if (!business) return

    // Validate
    if (lineItems.length === 0) {
      setError('At least one line item is required')
      return
    }

    if (lineItems.some((item) => !item.description || item.quantity === 0 || item.unit_price === 0)) {
      setError('Please fill in all line item details')
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      let customerId = customerOption === 'existing' ? selectedCustomerId : null
      if (customerOption === 'new') {
        if (!newCustomerName.trim()) {
          setError('Please enter a customer name')
          return
        }
        const customerResult = await addCustomer(business.id, { name: newCustomerName.trim() })
        if (!customerResult.success) {
          setError(customerResult.error || 'Failed to create customer')
          return
        }
        customerId = customerResult.data.id
      }

      const result = await createInvoice(business.id, {
        doc_type: 'invoice',
        status: 'unpaid',
        customer: customerId,
        due_date: dueDate || undefined,
        notes,
        line_items: lineItems.map(({ id, ...item }) => item),
      })

      if (result.success) {
        router.push(`/dashboard/receipts/${result.data.id}`)
      } else {
        setError(result.error || 'Failed to create invoice')
      }
    } catch (err) {
      setError('Error creating invoice')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page md:pl-8">
        <div className="mx-auto max-w-4xl flex items-center justify-center py-12 text-text-secondary">
          <PageSkeleton rows={4} />
        </div>
      </main>
    )
  }

  if (error && !business) {
    return (
      <main className="dashboard-page md:pl-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-negative font-semibold mb-4">{error}</p>
          <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-blue">
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
        </div>
      </main>
    )
  }

  const subtotal = calculateSubtotal()
  const total = subtotal

  return (
    <main className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Create Invoice</h1>
            <p className="mt-1 text-sm text-text-secondary">Create a new freestanding invoice for customer invoicing</p>
          </div>
          <Link href="/dashboard/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Draft Section */}
          {!showAiInput && (
            <button
              type="button"
              onClick={() => setShowAiInput(true)}
              className="w-full rounded-lg border-2 border-dashed border-blue/30 bg-blue/5 px-4 py-6 text-center hover:border-blue/50 hover:bg-blue/10 transition-colors"
            >
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-blue" />
              <p className="font-semibold text-text-primary">Draft with AI</p>
              <p className="mt-1 text-sm text-text-secondary">Describe what you're invoicing, and AI will generate line items</p>
            </button>
          )}

          {showAiInput && (
            <div className="dashboard-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Draft with AI</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiInput(false)
                    setAiDescription('')
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g., 5 bags of cement at 8000 each, due in 2 weeks for Musa. Include delivery on Friday for 3000."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue"
                rows={4}
              />
              <LoadingButton
                type="button"
                onClick={handleGenerateNotes}
                disabled={generating || !aiDescription.trim()}
                loading={generating}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {!generating && <Sparkles className="h-4 w-4" />}
                Generate Invoice
              </LoadingButton>
            </div>
          )}

          {/* Customer Section */}
          <div className="dashboard-panel p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Customer</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerOption"
                  value="existing"
                  checked={customerOption === 'existing'}
                  onChange={() => setCustomerOption('existing')}
                />
                <span className="text-sm font-medium text-text-primary">Existing Customer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="customerOption" value="new" checked={customerOption === 'new'} onChange={() => setCustomerOption('new')} />
                <span className="text-sm font-medium text-text-primary">New Customer</span>
              </label>
            </div>

            {customerOption === 'existing' ? (
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue"
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue"
              />
            )}
          </div>

          {/* Due Date Section */}
          <div className="dashboard-panel p-6">
            <label className="block mb-2">
              <span className="text-sm font-medium text-text-primary">Due Date (Optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          {/* Line Items Section */}
          <div className="dashboard-panel p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Line Items</h3>
            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, 'unit_price', e.target.value)}
                      placeholder="Price"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-sm font-semibold text-text-primary">{(item.quantity * item.unit_price).toFixed(2)}</div>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="text-negative hover:bg-negative/10 p-2 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary hover:bg-bg"
            >
              <Plus className="h-4 w-4" />
              Add Line Item
            </button>
          </div>

          {/* Totals Section */}
          <div className="dashboard-panel p-6">
            <div className="flex justify-end mb-4">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="dashboard-number font-medium">{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="dashboard-number">{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="dashboard-panel p-6">
            <label className="block mb-2">
              <span className="text-sm font-medium text-text-primary">Notes & Terms</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, conditions, etc."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue"
              rows={4}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard/invoices"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg"
            >
              Cancel
            </Link>
            <LoadingButton
              type="submit"
              loading={saving}
              className="dashboard-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Create Invoice
            </LoadingButton>
          </div>
        </form>
      </div>
    </main>
  )
}
