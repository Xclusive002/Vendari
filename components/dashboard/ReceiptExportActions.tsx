'use client'

import { useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Download, ImageDown, Loader2 } from 'lucide-react'

const EXPORT_TIMEOUT_MS = 25000

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('The export image could not be prepared.'))
  reader.readAsDataURL(blob)
})

export default function ReceiptExportActions({ documentRef, documentNumber }: { documentRef: React.RefObject<HTMLDivElement | null>; documentNumber: string }) {
  const [exporting, setExporting] = useState(false)

  const withTimeout = async <T,>(promise: Promise<T>, message: string) => {
    return await new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error(message))
      }, EXPORT_TIMEOUT_MS)

      promise
        .then((value) => {
          window.clearTimeout(timeoutId)
          resolve(value)
        })
        .catch((error) => {
          window.clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  const waitForImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]

    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve()
              return
            }

            const done = () => {
              image.removeEventListener('load', done)
              image.removeEventListener('error', done)
              resolve()
            }

            image.addEventListener('load', done, { once: true })
            image.addEventListener('error', done, { once: true })
            window.setTimeout(done, 5000)
          }),
      ),
    )
  }

  const renderCanvas = async () => {
    if (!documentRef.current) throw new Error('Receipt document is not ready.')

    const source = documentRef.current
    const clone = source.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    clone.style.width = '210mm'
    clone.style.maxWidth = '210mm'
    clone.style.background = '#ffffff'
    clone.style.boxShadow = 'none'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '-1'
    clone.style.opacity = '1'
    document.body.appendChild(clone)

    const noPrintElements = Array.from(clone.querySelectorAll('.no-print')) as HTMLElement[]
    noPrintElements.forEach((element) => {
      element.style.display = 'none'
    })

    try {
      await waitForImages(clone)
      if ('fonts' in document) await document.fonts.ready
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      return await withTimeout(
        html2canvas(clone, {
          backgroundColor: '#ffffff',
          scale: Math.min(window.devicePixelRatio || 2, 1.5),
          useCORS: true,
          logging: false,
          ignoreElements: (element) => element instanceof HTMLElement && element.classList.contains('no-print'),
          foreignObjectRendering: false,
        }),
        'Receipt export timed out. Please try again.',
      )
    } finally {
      clone.remove()
    }
  }

  const downloadImage = async () => {
    setExporting(true)
    try {
      const canvas = await renderCanvas()
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The image could not be created.')), 'image/png', 1)
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${documentNumber || 'receipt'}.png`
      link.href = url
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to download image:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate image. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const downloadPdf = async () => {
    setExporting(true)
    try {
      const canvas = await renderCanvas()
      const pageWidth = 210
      const pageHeight = (canvas.height * pageWidth) / canvas.width
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageWidth, pageHeight] })
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The PDF image could not be created.')), 'image/png', 1)
      })
      pdf.addImage(await blobToDataUrl(imageBlob), 'PNG', 0, 0, pageWidth, pageHeight)
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.download = `${documentNumber || 'receipt'}.pdf`
      link.href = pdfUrl
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.')
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
