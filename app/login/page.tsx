'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { login } from '@/app/actions/auth'
import { LoadingButton } from '@/components/ui/loading-button'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) return setError('Enter the email address on your Vendari account.')
    if (!password) return setError('Enter your password to continue.')

    setLoading(true)
    const result = await login(trimmedEmail, password)

    if (result.success) {
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard')
        return
      }
      router.replace('/dashboard')
      return
    }

    setLoading(false)
    setError(result.error || 'Check your email and password, then try again.')
  }

  return <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12"><div className="w-full max-w-md"><Link href="/" className="mx-auto mb-8 flex w-fit items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><Image src="/vendari-logo-png.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" /></Link><section className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-xl shadow-ink/5 sm:p-8"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue/5" /><div className="relative"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue/10 text-blue"><LockKeyhole className="h-5 w-5" /></div><h1 className="font-display text-3xl font-semibold text-ink">Welcome back.</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Sign in to see what is happening across your business.</p><form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate><div><label htmlFor="login-email" className="text-sm font-medium text-text-secondary">Email address</label><input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /></div><div><label htmlFor="login-password" className="text-sm font-medium text-text-secondary">Password</label><input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" disabled={loading} /></div>{error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}<button type="submit" disabled={loading} className="dashboard-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg shadow-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2">{loading ? 'Signing you in...' : 'Sign in'} {!loading && <ArrowRight className="h-4 w-4" />}</button></form><p className="mt-7 border-t border-border pt-6 text-center text-sm text-text-secondary">New to Vendari? <Link href="/register" className="font-semibold text-blue hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">Create your account</Link></p></div></section><p className="mt-6 text-center text-xs text-text-muted">Business operations, with less guesswork.</p></div></main>
}
