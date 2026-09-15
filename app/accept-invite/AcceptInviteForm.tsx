'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, KeyRound, Users } from 'lucide-react'
import { acceptInvite } from '@/app/actions/auth'
import { LoadingButton } from '@/components/ui/loading-button'

export default function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!token.trim()) return setError('Enter the invitation code from your email.')
    if (password && password.length < 8) return setError('Use at least 8 characters for your password.')
    setLoading(true)
    const result = await acceptInvite(token.trim(), email.trim(), password)
    if (result.success) router.replace('/dashboard')
    else { setError(result.error || 'Unable to accept invitation'); setLoading(false) }
  }

  return <main className="auth-shell"><div className="auth-card"><Link href="/" className="mx-auto mb-6 mt-6 flex w-fit"><Image src="/vendari-logo-png.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" /></Link><section className="border-t border-border bg-surface"><div className="auth-inner"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue/10 text-blue"><Users className="h-5 w-5" /></div><h1 className="font-display text-3xl font-semibold text-ink">Join the business workspace.</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Accept your Vendari invitation to access the dashboard and the role assigned to you.</p><form onSubmit={submit} className="mt-8 space-y-5"><div><label htmlFor="invite-token" className="text-sm font-medium text-text-secondary">Invitation code</label><input id="invite-token" value={token} onChange={(event) => setToken(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5 font-mono" autoComplete="one-time-code" /></div><div><label htmlFor="invite-email" className="text-sm font-medium text-text-secondary">Invited email address</label><input id="invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" autoComplete="email" /></div><div><label htmlFor="invite-password" className="text-sm font-medium text-text-secondary">Password <span className="font-normal text-text-muted">(required for new accounts)</span></label><input id="invite-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2.5" autoComplete="new-password" /></div>{error && <p role="alert" className="rounded-lg border border-negative/20 bg-negative/5 px-3 py-2.5 text-sm text-negative">{error}</p>}<LoadingButton type="submit" loading={loading} className="dashboard-primary flex w-full items-center justify-center gap-2">Accept invitation <ArrowRight className="h-4 w-4" /></LoadingButton></form><p className="mt-6 flex items-center gap-2 text-xs leading-5 text-text-muted"><KeyRound className="h-4 w-4 shrink-0" />New teammates create a password here. Existing Vendari users leave it blank, accept the invitation, then use their normal password the next time they sign in.</p></div></section></div></main>
}
