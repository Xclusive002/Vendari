'use client'

import { FormEvent, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
import { submitConciergeInquiry } from '@/app/actions/concierge'

export default function ConciergeInquiryPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const result = await submitConciergeInquiry({
      name: String(form.get('name') || ''),
      business_name: String(form.get('business_name') || ''),
      phone: String(form.get('phone') || ''),
      interest: String(form.get('interest') || ''),
    })
    if ('error' in result) {
      setError(result.error)
    } else {
      setSubmitted(true)
      event.currentTarget.reset()
    }
    submittingRef.current = false
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-bg px-5 py-8 text-text-primary sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-ink"><ArrowLeft className="h-4 w-4" />Back to Vendari</Link>
        <div className="mt-12 grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">VENDARI CONCIERGE</p><h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">Your business, seen. Handled by a real person.</h1><p className="mt-6 text-lg leading-8 text-text-secondary">Tell us what you are building. We&apos;ll walk through what your business needs first, with no commitment.</p><div className="mt-8 flex items-center gap-3 text-sm font-semibold text-ink"><MessageCircle className="h-5 w-5 text-blue" />A dedicated growth officer, reachable on WhatsApp.</div></div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            {submitted ? <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-positive" /><h2 className="mt-5 font-display text-2xl font-semibold text-ink">Thanks for reaching out.</h2><p className="mt-3 text-sm leading-6 text-text-secondary">A Vendari officer will review your details and get in touch.</p><Link href="/" className="mt-7 inline-flex rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white">Back to Vendari</Link></div> : <form onSubmit={handleSubmit} className="space-y-5"><div><label htmlFor="name" className="text-sm font-semibold text-ink">Your name</label><input id="name" name="name" required className="dashboard-input mt-2" /></div><div><label htmlFor="business_name" className="text-sm font-semibold text-ink">Business name</label><input id="business_name" name="business_name" required className="dashboard-input mt-2" /></div><div><label htmlFor="phone" className="text-sm font-semibold text-ink">Phone / WhatsApp number</label><input id="phone" name="phone" type="tel" required className="dashboard-input mt-2" /></div><div><label htmlFor="interest" className="text-sm font-semibold text-ink">What are you interested in?</label><textarea id="interest" name="interest" required rows={5} placeholder="Website, Google Business Profile, ads, or all three?" className="dashboard-input mt-2" /></div>{error && <p role="alert" className="text-sm font-semibold text-negative">{error}</p>}<button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? 'Sending...' : 'Talk to us about Concierge'}</button></form>}
          </div>
        </div>
      </div>
    </main>
  )
}
