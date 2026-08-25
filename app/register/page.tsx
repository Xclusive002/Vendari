'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MailCheck } from 'lucide-react'
import { register, verifyEmail } from '@/app/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [token, setToken] = useState('')
  const [registered, setRegistered] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!businessName.trim()) return setError('Enter your business name so Vendari can set up your workspace.')
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address for account verification.')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    setLoading(true)
    const result = await register(email.trim(), password, businessName.trim())
    if (result.success) setRegistered(true)
    else { setError(result.error || 'Check the details and try registering again.'); setLoading(false) }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!token.trim()) return setError('Enter the verification token from your email.')
    setLoading(true)
    const result = await verifyEmail(token.trim())
    if (result.success) router.push('/login')
    else { setError(result.error || 'That verification token is not valid. Request a new one from the email you received.'); setLoading(false) }
  }

  return <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12"><div className="w-full max-w-md"><Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-md font-display text-lg font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm text-white">V</span> Vendari</Link><section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-xl shadow-ink/5 sm:p-8"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-violet/5" /><div className="relative"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue/10 text-blue"><MailCheck className="h-5 w-5" /></div><h1 className="font-display text-3xl font-semibold text-ink">Create your account.</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Set up a clear home for the work behind your business.</p>{!registered ? <form onSubmit={handleRegister} className="mt-8 space-y-5" noValidate><div><label htmlFor="register-business" className="text-sm font-medium text-text-secondary">Business name</label><input id="register-business" value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /></div><div><label htmlFor="register-email" className="text-sm font-medium text-text-secondary">Email address</label><input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /></div><div><label htmlFor="register-password" className="text-sm font-medium text-text-secondary">Password</label><input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /><p className="mt-1.5 text-xs text-text-muted">Use at least 8 characters.</p></div>{error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}<button type="submit" disabled={loading} className="dashboard-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg shadow-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2">{loading ? 'Creating your account...' : 'Create account'} {!loading && <ArrowRight className="h-4 w-4" />}</button></form> : <form onSubmit={handleVerify} className="mt-8 space-y-5" noValidate><div className="rounded-lg border border-blue/20 bg-blue/5 p-4 text-sm leading-6 text-text-secondary">Your account is created. Enter the verification token sent to <strong className="text-ink">{email}</strong> to activate it.</div><div><label htmlFor="verification-token" className="text-sm font-medium text-text-secondary">Verification token</label><input id="verification-token" value={token} onChange={(event) => setToken(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /></div>{error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}<button type="submit" disabled={loading} className="dashboard-primary w-full rounded-lg px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2">{loading ? 'Activating account...' : 'Verify email'}</button></form>}<p className="mt-7 border-t border-border pt-6 text-center text-sm text-text-secondary">Already have an account? <Link href="/login" className="font-semibold text-blue hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">Sign in</Link></p></div></section></div></main>
}
