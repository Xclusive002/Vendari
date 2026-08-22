'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { TrendingUp, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('[Login] Error:', error)
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Back to Home */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-300 hover:text-white transition">
        <TrendingUp className="w-5 h-5" />
        <span>Vendari</span>
      </Link>

      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white text-center">Secure Access</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Sign in to your Vendari account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 uppercase"
                  disabled={loading}
                />
                <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-slate-700 border-slate-600 text-white mt-1" required disabled={loading} />
              </div>

              <Button
                type="submit"
                disabled={!email || !password || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center mb-4">Need an account?</p>
              <Link href="/get-access-code">
                <Button variant="outline" className="w-full border-slate-600 hover:bg-slate-700 text-white bg-transparent">
                  Create an Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-8">
          © 2024 Vendari. Business Management Software.
        </p>
      </div>
    </div>
  )
}
