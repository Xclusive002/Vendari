'use client'

import { useRef, useState } from 'react'

import { initializePayment } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'

export default function BillingPage() {
  const [planId, setPlanId] = useState('1')
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)
  const paymentRef = useRef(false)
  const [error, setError] = useState('')

  const startPayment = async () => {
    if (paymentRef.current) return
    paymentRef.current = true
    setLoading(true)
    setError('')
    try {
      const result = await initializePayment(businessId, planId)
      if ('authorization_url' in result && result.success && result.authorization_url) {
        window.location.href = result.authorization_url
        return
      }
      setError(result.error || 'Unable to initialize payment')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to initialize payment')
    } finally {
      paymentRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-3xl">
      <Card className="dashboard-panel">
        <CardHeader>
          <CardTitle className="font-display text-ink">Billing</CardTitle>
          <CardDescription>Choose a plan and continue securely with Paystack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="business-id" className="block text-sm font-medium text-text-secondary">Business ID</label>
          <input id="business-id" className="dashboard-input w-full p-2" value={businessId} onChange={(event) => setBusinessId(event.target.value)} />
          <label htmlFor="billing-plan" className="block text-sm font-medium text-text-secondary">Plan</label>
          <select id="billing-plan" className="dashboard-input w-full p-2" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="1">Plan 1</option>
            <option value="2">Plan 2</option>
            <option value="3">Plan 3</option>
          </select>
          {error && <p className="text-sm text-negative">{error}</p>}
          <LoadingButton onClick={startPayment} loading={loading} disabled={!businessId} className="dashboard-primary">Continue to Paystack</LoadingButton>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}