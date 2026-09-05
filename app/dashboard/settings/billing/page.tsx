'use client'

import { useEffect, useRef, useState } from 'react'

import { getBusiness } from '@/app/actions/business'
import { getPlans, getSubscription, initializePayment } from '@/app/actions/payment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'

export default function BillingPage() {
  const [businessId, setBusinessId] = useState('')
  const [plans, setPlans] = useState<Array<{ id: number; name: string; amount: number; interval: string; feature_flags: Record<string, boolean> }>>([])
  const [subscription, setSubscription] = useState<{ plan: string; status: string; renews_at: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const paymentRef = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getBusiness(), getPlans()]).then(async ([business, planResult]) => {
      if (business) {
        setBusinessId(String(business.id))
        const subscriptionResult = await getSubscription(String(business.id))
        if (subscriptionResult.success && subscriptionResult.data) setSubscription(subscriptionResult.data)
      }
      if (planResult.success) setPlans(planResult.data.filter((plan) => plan.amount > 0))
      else setError(planResult.error || 'Unable to load plans')
    }).finally(() => setLoadingPage(false))
  }, [])

  const startPayment = async () => {
    if (paymentRef.current) return
    paymentRef.current = true
    setLoading(true)
    setError('')
    try {
      if (!selectedPlan) return
      const result = await initializePayment(businessId, String(selectedPlan))
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
        <CardContent className="space-y-5">
          {loadingPage ? <p className="text-sm text-text-secondary">Loading plans...</p> : <>
          {subscription && <div className="rounded-xl border border-positive/20 bg-positive/5 p-4"><p className="text-xs uppercase tracking-[0.16em] text-positive">Current plan</p><p className="mt-2 text-lg font-semibold capitalize text-ink">{subscription.plan}</p><p className="mt-1 text-sm text-text-secondary">Status: {subscription.status}{subscription.renews_at ? ` · Renews ${new Date(subscription.renews_at).toLocaleDateString()}` : ''}</p></div>}
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const active = selectedPlan === plan.id
              return <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={`rounded-xl border p-5 text-left transition ${active ? 'border-blue bg-blue/5 shadow-md' : 'border-border bg-surface hover:border-blue/40'}`}><p className="font-display text-xl font-semibold capitalize text-ink">{plan.name}</p><p className="mt-2 font-mono text-2xl text-ink">₦{plan.amount.toLocaleString()}<span className="font-body text-sm text-text-secondary">/{plan.interval}</span></p><ul className="mt-4 space-y-2 text-sm text-text-secondary">{Object.entries(plan.feature_flags).filter(([, enabled]) => enabled).slice(0, 5).map(([flag]) => <li key={flag}>✓ {flag.replaceAll('_', ' ')}</li>)}</ul></button>
            })}
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <LoadingButton onClick={startPayment} loading={loading} disabled={!businessId || !selectedPlan} className="dashboard-primary w-full">Continue to Paystack</LoadingButton>
          </>}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}