'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Copy, ArrowRight, AlertCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference')
        
        if (!reference) {
          setError('No payment reference found. Please try again.')
          setLoading(false)
          return
        }

        // Verify payment with backend
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Payment verification failed')
          setLoading(false)
          return
        }

        setAccessCode('')
        setLoading(false)
      } catch (err) {
        console.error('[v0] Payment verification error:', err)
        setError('An error occurred during payment verification')
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  const handleCopyCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleProceedToLogin = () => {
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <CardTitle className="text-white">Payment Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/payment')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg bg-slate-800 border-slate-700">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-white text-2xl">Payment Successful!</CardTitle>
          <p className="text-slate-400 mt-2">Your payment has been verified and processed successfully.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Access Code Section */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Your Access Code</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3">
                <p className="text-2xl font-mono font-bold text-blue-400 tracking-widest">
                  {accessCode}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyCode}
                className="border-slate-600 hover:bg-slate-700 bg-transparent"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>
            )}
          </div>

          {/* Important Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">Important:</span> Save your access code somewhere safe. You'll need it to login to your Vendari account.
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Amount Paid:</span>
              <span className="text-white font-semibold">₦20,000.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Access Duration:</span>
              <span className="text-white font-semibold">1 Year</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-green-400 font-semibold">Active</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleProceedToLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 text-base"
          >
            Proceed to Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
