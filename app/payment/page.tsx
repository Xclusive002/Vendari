'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { TrendingUp, Lock, Copy, Check } from 'lucide-react'
import { initializePayment, verifyPayment } from '@/app/actions/payment'
import { toast } from 'sonner'

export default function PaymentPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [reference, setReference] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      const result = await initializePayment(email)

      if (result.success) {
        setReference(result.reference)
        // Open Paystack payment page
        if (typeof window !== 'undefined') {
          window.location.href = result.authorization_url
        }
      } else {
        toast.error(result.error || 'Failed to initialize payment')
      }
    } catch (error) {
      console.error('[Payment] Error:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!reference) {
      toast.error('Please enter your payment reference')
      return
    }

    setLoading(true)

    try {
      const result = await verifyPayment(reference)

      if (result.success) {
        setAccessCode(result.accessCode)
        toast.success('Payment successful! Your access code is ready.')
      } else {
        toast.error(result.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('[Payment] Error:', error)
      toast.error('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Back to Home */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-300 hover:text-white transition">
        <TrendingUp className="w-5 h-5" />
        <span>Vendari</span>
      </Link>

      <div className="w-full max-w-md">
        {!accessCode ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white text-center">Get Access Code</CardTitle>
              <CardDescription className="text-slate-400 text-center">
                Pay ₦20,000 and get instant access to Vendari for 1 year
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Payment Form */}
              <form onSubmit={handleInitializePayment} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">₦20,000</span>
                    <span className="text-slate-400">one-time payment</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">Includes 1-year access to all features</p>
                </div>

                <Button
                  type="submit"
                  disabled={!email || loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  {loading ? 'Processing...' : 'Pay with Paystack'}
                </Button>
              </form>

              {/* Verification Section */}
              <div className="pt-6 border-t border-slate-700 space-y-4">
                <p className="text-sm text-slate-400">Already paid? Verify your payment</p>
                <div className="space-y-2">
                  <label htmlFor="reference" className="text-sm font-medium text-slate-300">
                    Payment Reference
                  </label>
                  <Input
                    id="reference"
                    placeholder="e.g., 123456789"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleVerifyPayment}
                  disabled={!reference || loading}
                  variant="outline"
                  className="w-full border-slate-600 hover:bg-slate-700 text-white bg-transparent"
                >
                  {loading ? 'Verifying...' : 'Verify Payment'}
                </Button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-sm text-slate-400 mb-4">Remember your access code to log in</p>
                <Link href="/login">
                  <Button variant="link" className="text-blue-400 hover:text-blue-300">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
              <CardDescription className="text-slate-400">Your access code has been generated</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <p className="text-sm text-slate-400 mb-2 text-center">Your Access Code</p>
                <div className="bg-slate-800 rounded p-4 font-mono text-2xl text-center text-blue-400 font-bold">
                  {accessCode}
                </div>
                <button
                  onClick={copyAccessCode}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-300">What's Next?</p>
                <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                  <li>Save your access code in a safe place</li>
                  <li>Log in using your access code</li>
                  <li>Set up your business profile</li>
                  <li>Start managing your business</li>
                </ul>
              </div>

              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-slate-500 text-sm mt-8">
          © 2024 Vendari. Business Management Software.
        </p>
      </div>
    </div>
  )
}
