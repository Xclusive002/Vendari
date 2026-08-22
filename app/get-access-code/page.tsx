'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { register, verifyEmail } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function RegistrationPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [token, setToken] = useState('')
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const result = await register(email, password, businessName)
    setLoading(false)
    if (result.success) {
      setRegistered(true)
      toast.success('Account created. Check the backend console for your verification token.')
    } else toast.error(result.error || 'Registration failed')
  }

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const result = await verifyEmail(token)
    setLoading(false)
    if (result.success) {
      toast.success('Email verified. You can now log in.')
      router.push('/login')
    } else toast.error(result.error || 'Verification failed')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Link href="/" className="fixed top-6 left-6 flex items-center gap-2 text-slate-300 hover:text-white transition">
        <ArrowLeft className="w-5 h-5" /> Back
      </Link>
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4"><TrendingUp className="w-7 h-7 text-blue-400" /><span className="text-white text-xl">Vendari</span></div>
          <CardTitle className="text-2xl text-white">Create your account</CardTitle>
          <CardDescription className="text-slate-400">
            {registered ? 'Enter the verification token printed by the Django backend.' : 'Start managing your business with Vendari.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!registered ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
              <Input type="password" placeholder="Password (at least 8 characters)" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} disabled={loading} />
              <Input placeholder="Business name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required disabled={loading} />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><Input className="pl-10" placeholder="Verification token" value={token} onChange={(event) => setToken(event.target.value)} required disabled={loading} /></div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? 'Verifying...' : 'Verify Email'}</Button>
            </form>
          )}
          <p className="text-sm text-slate-400 text-center mt-6">Already registered? <Link href="/login" className="text-blue-400 hover:text-blue-300">Log in</Link></p>
        </CardContent>
      </Card>
    </main>
  )
}
