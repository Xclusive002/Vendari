'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

import { verifyEmail } from '@/app/actions/auth'
import { LoadingButton } from '@/components/ui/loading-button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams])

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Enter the email you registered with.')
      return
    }
    if (!code.trim() || code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    const result = await verifyEmail(trimmedEmail, code.trim())
    setLoading(false)

    if (result.success) {
      setVerified(true)
      toast.success('Email verified successfully!')
      setTimeout(() => router.push('/login'), 1200)
      return
    }

    setError(result.error || 'Verification failed. Please try again.')
  }

  if (verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl shadow-ink/5 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">Email verified</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Your account has been confirmed. Redirecting you to sign in.</p>
          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue">
            Go to login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
          <Image src="/vendari-logo-png.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" />
        </Link>
        <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-xl shadow-ink/5 sm:p-8">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-violet/5" />
          <div className="relative">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue/10 text-blue">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">Verify your email</h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">We sent a 6-digit code to your email. Enter it below to complete registration.</p>
            <form onSubmit={handleVerify} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="verify-email" className="text-sm font-medium text-text-secondary">Email address</label>
                <input id="verify-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} />
              </div>
              <div>
                <label htmlFor="verify-code" className="text-sm font-medium text-text-secondary">Verification code</label>
                <input id="verify-code" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="dashboard-input mt-2 w-full px-3 py-2.5 tracking-[0.5em] text-center" placeholder="123456" disabled={loading} />
              </div>

              {error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}

              <LoadingButton type="submit" loading={loading} className="w-full">
                Verify email <ArrowRight className="h-4 w-4" />
              </LoadingButton>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
