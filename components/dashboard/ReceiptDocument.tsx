'use client'

import Image from 'next/image'

export type ReceiptBusiness = {
  name: string
  address?: string
  phone?: string
  logo?: string | null
}

export type ReceiptInvoice = {
  id: number
  business: number
  customer?: number | null
  customer_name?: string | null
  doc_type: 'receipt' | 'invoice'
  doc_number: string
  status: 'paid' | 'unpaid' | 'partial'
  issue_date: string
  due_date?: string | null
  notes?: string
  subtotal: string | number
  tax_amount: string | number
  total: string | number
  linked_sale?: number | null
  line_items: Array<{
    id: number
    description: string
    quantity: number
    unit_price: string | number
    line_total: string | number
  }>
}

function money(value: string | number) {
  return `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { bg: '#DCFCE7', text: '#166534' } // --positive with light bg
    case 'partial':
      return { bg: '#FEF3C7', text: '#92400E' } // --warning with light bg
    case 'unpaid':
      return { bg: '#F3E8E8', text: '#7F1D1D' } // --negative with light bg
    default:
      return { bg: '#F3F4F6', text: '#374151' }
  }
}

export default function ReceiptDocument({ invoice, business, documentRef }: { invoice: ReceiptInvoice; business: ReceiptBusiness; documentRef: React.RefObject<HTMLDivElement | null> }) {
  const isInvoice = invoice.doc_type === 'invoice'
  const statusColors = getStatusColor(invoice.status)
  const hasLineItems = invoice.line_items && invoice.line_items.length > 0

  return (
    <article
      ref={documentRef}
      className="receipt-document"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#0B1220',
        padding: '48px',
        fontFamily: '"Inter", sans-serif',
        lineHeight: 1.6,
        fontSize: '14px',
        maxWidth: '210mm',
        margin: '0 auto',
      }}
    >
      {/* Header: Business info and document type */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '32px',
          borderBottom: '2px solid #0B1220',
          paddingBottom: '32px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
          {business.logo && (
            <Image
              src={business.logo}
              alt="Business logo"
              width={80}
              height={80}
              unoptimized
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 0 12px 0',
                color: '#06122B',
              }}
            >
              {business.name}
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#4B5768',
                margin: '8px 0 6px 0',
                whiteSpace: 'pre-line',
              }}
            >
              {business.address || 'Address not provided'}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: '#4B5768',
                margin: '0',
              }}
            >
              {business.phone || 'Phone not provided'}
            </p>
          </div>
        </div>

        {/* Document type and status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: '#06122B',
              textTransform: 'uppercase',
            }}
          >
            {isInvoice ? 'INVOICE' : 'RECEIPT'}
          </p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: '"IBM Plex Mono", monospace',
              margin: '0 0 16px 0',
              color: '#0B1220',
            }}
          >
            #{invoice.doc_number}
          </p>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {invoice.status}
          </div>
        </div>
      </div>

      {/* Bill to and dates section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          borderBottom: '1px solid #E3E8F1',
          paddingBottom: '24px',
          marginBottom: '24px',
          fontSize: '13px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#8792A2',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0',
            }}
          >
            Bill To
          </p>
          <p
            style={{
              fontWeight: 600,
              color: '#0B1220',
              margin: '0',
            }}
          >
            {invoice.customer_name || (invoice.customer ? `Customer #${invoice.customer}` : 'Walk-in Customer')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#4B5768' }}>Issue Date:</span>
            <br />
            <span style={{ fontWeight: 600, color: '#0B1220' }}>{date(invoice.issue_date)}</span>
          </div>
          {isInvoice && invoice.due_date && (
            <div>
              <span style={{ color: '#4B5768' }}>Due Date:</span>
              <br />
              <span style={{ fontWeight: 600, color: '#0B1220' }}>{date(invoice.due_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line items table */}
      {hasLineItems && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '32px',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid #0B1220',
                backgroundColor: 'transparent',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  paddingBottom: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8792A2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'inherit',
                }}
              >
                Description
              </th>
              <th
                style={{
                  textAlign: 'right',
                  paddingBottom: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8792A2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'inherit',
                  width: '80px',
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: 'right',
                  paddingBottom: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8792A2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'inherit',
                  width: '120px',
                }}
              >
                Unit Price
              </th>
              <th
                style={{
                  textAlign: 'right',
                  paddingBottom: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8792A2',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'inherit',
                  width: '120px',
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid #E3E8F1',
                  backgroundColor: index % 2 === 0 ? 'transparent' : '#F7F9FC',
                }}
              >
                <td
                  style={{
                    padding: '16px 0',
                    color: '#0B1220',
                    fontWeight: 500,
                  }}
                >
                  {item.description}
                </td>
                <td
                  style={{
                    padding: '16px 0',
                    textAlign: 'right',
                    color: '#0B1220',
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: '16px 0',
                    textAlign: 'right',
                    color: '#0B1220',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 500,
                  }}
                >
                  {money(item.unit_price)}
                </td>
                <td
                  style={{
                    padding: '16px 0',
                    textAlign: 'right',
                    color: '#0B1220',
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 600,
                  }}
                >
                  {money(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals section */}
      <div
        style={{
          marginLeft: 'auto',
          width: '100%',
          maxWidth: '280px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            borderBottom: '1px solid #E3E8F1',
            marginBottom: '12px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: '#4B5768' }}>Subtotal</span>
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 500,
              color: '#0B1220',
            }}
          >
            {money(invoice.subtotal)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            borderBottom: '1px solid #E3E8F1',
            marginBottom: '12px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: '#4B5768' }}>Tax</span>
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 500,
              color: '#0B1220',
            }}
          >
            {money(invoice.tax_amount)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '2px solid #0B1220',
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#0B1220' }}>Total</span>
          <span
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              color: '#0B1220',
            }}
          >
            {money(invoice.total)}
          </span>
        </div>
      </div>

      {/* Notes section */}
      {invoice.notes && (
        <footer
          style={{
            borderTop: '1px solid #E3E8F1',
            paddingTop: '20px',
            marginTop: '32px',
            fontSize: '13px',
            color: '#4B5768',
          }}
        >
          <p
            style={{
              fontWeight: 600,
              color: '#0B1220',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}
          >
            Notes & Terms
          </p>
          <p
            style={{
              whiteSpace: 'pre-line',
              margin: '0',
              lineHeight: 1.6,
            }}
          >
            {invoice.notes}
          </p>
        </footer>
      )}

      {/* Footer: Print indicator */}
      <div
        style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid #E3E8F1',
          textAlign: 'center',
          fontSize: '11px',
          color: '#8792A2',
        }}
        className="no-print"
      >
        Generated by Vendari on {new Date().toLocaleDateString()}
      </div>
    </article>
  )
}
