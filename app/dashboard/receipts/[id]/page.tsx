'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getBusiness, getInvoice } from '@/app/actions/business'
import ReceiptDocument, { type ReceiptBusiness, type ReceiptInvoice } from '@/components/dashboard/ReceiptDocument'

const ReceiptExportActions = dynamic(() => import('@/components/dashboard/ReceiptExportActions'), { ssr: false })

export default function ReceiptPage() {
  const params = useParams<{ id: string }>()
  const documentRef = useRef<HTMLDivElement>(null)
  const [invoice, setInvoice] = useState<ReceiptInvoice | null>(null)
  const [business, setBusiness] = useState<ReceiptBusiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getBusiness()
      .then(async (businessResult) => {
        if (!businessResult) {
          setError('Business profile could not be loaded.')
          return
        }
        const invoiceResult = await getInvoice(businessResult.id, params.id)
        if (!invoiceResult.success) {
          setError(invoiceResult.error)
          return
        }
        setBusiness({
          name: businessResult.name,
          address: businessResult.address,
          phone: businessResult.phone,
          logo: businessResult.logo,
        })
        setInvoice(invoiceResult.data as ReceiptInvoice)
      })
      .catch(() => setError('This receipt could not be loaded.'))
      .finally(() => setLoading(false))
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading)
    return (
      <main className="dashboard-page md:pl-8">
        <div className="mx-auto max-w-4xl flex items-center justify-center py-12 text-text-secondary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading receipt...
        </div>
      </main>
    )

  if (error || !invoice || !business)
    return (
      <main className="dashboard-page md:pl-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-negative font-semibold mb-4">{error || 'Receipt unavailable.'}</p>
          <Link href="/dashboard/sales" className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:text-blue">
            <ArrowLeft className="h-4 w-4" />
            Back to sales
          </Link>
        </div>
      </main>
    )

  return (
    <>
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            main.receipt-page {
              padding: 0;
              background: white;
            }

            .receipt-page {
              min-height: unset;
              background: white;
              padding: 0;
            }

            .receipt-actions {
              display: none !important;
            }

            .no-print {
              display: none !important;
            }

            .receipt-document {
              box-shadow: none;
              page-break-after: avoid;
              page-break-inside: avoid;
            }

            @page {
              margin: 0;
              size: 210mm auto;
            }
          }
        `}
      </style>

      <main className="receipt-page dashboard-page md:pl-8">
        <div className="mx-auto max-w-4xl">
          <div className="receipt-actions mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/dashboard/sales" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              Back to sales
            </Link>
            <div className="flex flex-wrap gap-2">
              <ReceiptExportActions documentRef={documentRef} documentNumber={invoice.doc_number} />
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
          <ReceiptDocument invoice={invoice} business={business} documentRef={documentRef} />
        </div>
      </main>
    </>
  )
}
