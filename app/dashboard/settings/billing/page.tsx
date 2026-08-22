'use client'

import { useState } from 'react'

import { initializePayment } from '@/app/actions/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BillingPage() {
  const [planId, setPlanId] = useState('1')
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startPayment = async () => {
    setLoading(true)
    setError('')
    const result = await initializePayment(businessId, planId)
    if ('authorization_url' in result && result.success && result.authorization_url) {
      window.location.href = result.authorization_url
      return
    }
    setError(result.error || 'Unable to initialize payment')
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Billing</CardTitle>
          <CardDescription>Choose a plan and continue securely with Paystack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input className="w-full rounded-md bg-slate-700 border border-slate-600 p-2 text-white" placeholder="Business ID" value={businessId} onChange={(event) => setBusinessId(event.target.value)} />
          <select className="w-full rounded-md bg-slate-700 border border-slate-600 p-2 text-white" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="1">Plan 1</option>
            <option value="2">Plan 2</option>
            <option value="3">Plan 3</option>
          </select>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button onClick={startPayment} disabled={!businessId || loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Starting payment...' : 'Continue to Paystack'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}