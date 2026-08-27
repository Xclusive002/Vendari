'use client'

import { useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Download, ImageDown, Loader2 } from 'lucide-react'

export default function ReceiptExportActions({ documentRef, documentNumber }: { documentRef: React.RefObject<HTMLDivElement | null>; documentNumber: string }) {
  const [exporting, setExporting] = useState(false)

  const renderCanvas = async () => {
    if (!documentRef.current) throw new Error('Receipt document is not ready.')
    const noPrintElements = documentRef.current.querySelectorAll('.no-print')
    noPrintElements.forEach((element) => {
      ;(element as HTMLElement).style.display = 'none'
    })

    try {
      return await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
    } finally {
      noPrintElements.forEach((element) => {
        ;(element as HTMLElement).style.display = ''
      })
    }
  }

  const downloadImage = async () => {
    setExporting(true)
    try {
      const canvas = await renderCanvas()
      const link = document.createElement('a')
      link.download = `${documentNumber || 'receipt'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const downloadPdf = async () => {
    setExporting(true)
    try {
      const canvas = await renderCanvas()
      const width = 210
      const height = (canvas.height * width) / canvas.width
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [width, height] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height)
      pdf.save(`${documentNumber || 'receipt'}.pdf`)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={downloadPdf}
        disabled={exporting}
        className="dashboard-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {exporting ? 'Preparing...' : 'Download as PDF'}
      </button>
      <button
        type="button"
        onClick={downloadImage}
        disabled={exporting}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
      >
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
        {exporting ? 'Preparing...' : 'Download as Image'}
      </button>
    </>
  )
}
