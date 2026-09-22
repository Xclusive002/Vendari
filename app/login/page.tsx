'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { exchangeGoogleCode, getGoogleSignInUrl, login, restoreRememberedSession } from '@/app/actions/auth'
import { LoadingButton } from '@/components/ui/loading-button'
import LoadingSpinner from '@/components/ui/loading-spinner'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [restoring, setRestoring] = useState(true)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request')
  const [resetCode, setResetCode] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    let active = true
    restoreRememberedSession().then((result) => {
      if (active && result.success) window.location.replace('/dashboard')
    }).finally(() => {
      if (active) setRestoring(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('oauth_code')
    const oauthError = searchParams.get('oauth_error')
    if (oauthError) setError(oauthError)
    if (!code) return
    setGoogleLoading(true)
    exchangeGoogleCode(code).then((result) => {
      if (result.success) window.location.replace('/dashboard')
      else setError(result.error)
    }).finally(() => setGoogleLoading(false))
  }, [])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      window.location.assign(await getGoogleSignInUrl())
    } catch (error) {
      setGoogleLoading(false)
      setError(error instanceof Error ? error.message : 'Google sign-in is unavailable.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter the email address on your Vendari account.')
      return
    }
    if (!password) {
      setError('Enter your password to continue.')
      return
    }

    setLoading(true)

    try {
      const result = await login(trimmedEmail, password, rememberMe)

      if (result.success) {
        window.location.assign('/dashboard')
        return
      }

      if (result.error?.includes('verify your email')) {
        toast.error('Please verify your email before logging in.')
        router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`)
        return
      }

      setError(result.error || 'Check your email and password, then try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResetMessage('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(result.detail || 'We could not start the password reset.')
        return
      }
      setResetStep('confirm')
      setResetMessage('If an account matches that email, a reset code has been sent. Check your inbox.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResetMessage('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: resetCode.trim(), password: resetPassword }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(result.detail || 'The reset code is invalid or expired.')
        return
      }
      setResetOpen(false)
      setResetStep('request')
      setResetCode('')
      setResetPassword('')
      setShowResetPassword(false)
      setResetMessage('Password reset successfully. Sign in with your new password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="mx-auto mb-6 mt-6 flex w-fit items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
          <Image src="/vendari-logo-png.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" />
        </Link>
        <section className="relative overflow-hidden border-t border-border bg-surface">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue/5" />
          <div className="auth-inner">
            {loading || restoring ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue/10 text-blue">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h1 className="font-display text-3xl font-semibold text-ink">Welcome back.</h1>
                <p className="mt-2 text-sm leading-6 text-text-secondary">Sign in to see what is happening across your business.</p>
              </>
            )}

            {!resetOpen && <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading || loading || restoring} className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm hover:bg-bg disabled:opacity-60"><span className="font-bold text-blue">G</span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</button>}
            {!resetOpen && <div className="my-5 flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-border" /><span>or use email</span><span className="h-px flex-1 bg-border" /></div>}
            {resetOpen ? <form onSubmit={resetStep === 'request' ? handleResetRequest : handleResetConfirm} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium text-text-secondary">Email address</label>
                <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} required />
              </div>
              {resetStep === 'confirm' && <>
                <div>
                  <label htmlFor="reset-code" className="text-sm font-medium text-text-secondary">Reset code</label>
                  <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" value={resetCode} onChange={(event) => setResetCode(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} required />
                </div>
                <div>
                  <label htmlFor="reset-password" className="text-sm font-medium text-text-secondary">New password</label>
                  <div className="relative mt-2">
                    <input id="reset-password" type={showResetPassword ? 'text' : 'password'} autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="dashboard-input w-full px-3 py-2.5 pr-11" disabled={loading} minLength={8} required />
                    <button type="button" onClick={() => setShowResetPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue" aria-label={showResetPassword ? 'Hide password' : 'Show password'} disabled={loading}>
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>}
              {error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}
              {resetMessage && <p role="status" className="rounded-lg border border-positive/20 bg-positive/5 px-3 py-2.5 text-sm text-positive">{resetMessage}</p>}
              <button type="submit" disabled={loading} className="dashboard-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg shadow-blue/15">{resetStep === 'request' ? 'Send reset code' : 'Change password'}</button>
              <button type="button" onClick={() => { setResetOpen(false); setResetStep('request'); setError(''); setResetMessage('') }} className="w-full text-sm font-semibold text-blue">Back to sign in</button>
            </form> : <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="text-sm font-medium text-text-secondary">Email address</label>
                <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} />
              </div>

              <div>
                <label htmlFor="login-password" className="text-sm font-medium text-text-secondary">Password</label>
                <div className="relative mt-2">
                  <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="dashboard-input w-full px-3 py-2.5 pr-11" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue" aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={loading}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label htmlFor="remember-me" className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-border text-blue focus:ring-blue" disabled={loading} />
                Remember me on this device
              </label>

              {error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}

              <button type="submit" disabled={loading} className="dashboard-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg shadow-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </form>}

            {!resetOpen && <button type="button" onClick={() => { setResetOpen(true); setError(''); setResetMessage('') }} className="mt-4 w-full text-center text-sm font-semibold text-blue">Forgot your password?</button>}

            <p className="mt-6 text-center text-sm text-text-secondary">
              Don&apos;t have an account? <Link href="/register" className="font-semibold text-blue">Create one</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
