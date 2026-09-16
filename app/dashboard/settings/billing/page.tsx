'use client'

import { useEffect, useRef, useState } from 'react'

import { getBusiness } from '@/app/actions/business'
import { getPlans, getSubscription, initializePayment } from '@/app/actions/payment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'

const PRO_FEATURES = [
  '5-day free membership trial',
  'Sales logging and sales history',
  'Inventory, stock levels, low-stock alerts, and restocking',
  'Customer records and customer purchase history',
  'Expense tracking and financial summaries',
  'Invoices, receipts, and invoice payment links',
  'Dashboard totals, trends, profit, and top-product reporting',
  'Advanced reports and downloadable report exports',
  'AI questions, AI insights, and forecasting',
  'Voice entry for sales and inventory',
  'WhatsApp sales, inventory restocks, and customer logging by text or voice note',
  'Team members, staff roles, invitations, and activity controls',
  'Business profile, settings, notifications, and secure account access',
  'All future Vendari product improvements included in membership',
] as const

export default function BillingPage() {
  const [businessId, setBusinessId] = useState('')
  const [plans, setPlans] = useState<Array<{ id: number; name: string; amount: number; interval: string; feature_flags: Record<string, boolean>; limits: Record<string, number> }>>([])
  const [subscription, setSubscription] = useState<{ plan: string; status: string; renews_at: string | null; trial_active: boolean; trial_ends_at: string | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
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
      const selectedPlan = plans.find((plan) => plan.name.toLowerCase() === 'pro' && plan.interval === billingInterval)
      if (!selectedPlan) {
        setError('This billing interval is not available yet.')
        return
      }
      const result = await initializePayment(businessId, String(selectedPlan.id), billingInterval)
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
          <CardTitle className="font-display text-ink">Membership</CardTitle>
          <CardDescription>Become a member and continue securely with Paystack.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingPage ? <p className="text-sm text-text-secondary">Loading plans...</p> : <>
          {subscription && <div className="rounded-xl border border-positive/20 bg-positive/5 p-4"><p className="text-xs uppercase tracking-[0.16em] text-positive">Current plan</p><p className="mt-2 text-lg font-semibold capitalize text-ink">{subscription.plan}</p><p className="mt-1 text-sm text-text-secondary">{subscription.trial_active && subscription.trial_ends_at ? `5-day trial · Ends ${new Date(subscription.trial_ends_at).toLocaleDateString()}` : `Status: ${subscription.status}${subscription.renews_at ? ` · Renews ${new Date(subscription.renews_at).toLocaleDateString()}` : ''}`}</p></div>}
          <div className="mx-auto flex w-fit rounded-full border border-border bg-bg p-1" role="group" aria-label="Choose billing interval">
            {(['monthly', 'yearly'] as const).map((option) => <button key={option} type="button" onClick={() => setBillingInterval(option)} aria-pressed={billingInterval === option} className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all ${billingInterval === option ? 'bg-brand-gradient text-white shadow-sm' : 'text-text-secondary hover:text-ink'}`}>{option}{option === 'yearly' && <span className="ml-2 text-xs">2 months free</span>}</button>)}
          </div>
          {(() => {
            const plan = plans.find((item) => item.name.toLowerCase() === 'pro' && item.interval === billingInterval)
            return <div className="rounded-xl border border-blue bg-surface p-5 shadow-[var(--shadow-card)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-xl font-semibold capitalize text-ink">Pro membership</p><p className="mt-2 font-mono text-2xl text-ink">₦{plan?.amount.toLocaleString() || (billingInterval === 'yearly' ? '99,999' : '9,999')}<span className="font-body text-sm text-text-secondary">/ {billingInterval === 'yearly' ? 'year' : 'month'}</span></p></div>{billingInterval === 'yearly' && <span className="rounded-full bg-positive/10 px-3 py-1 text-sm font-bold text-positive">Save ₦19,989 · 2 months free</span>}</div><ul className="mt-5 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">{PRO_FEATURES.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></div>
          })()}
          {error && <p className="text-sm text-negative">{error}</p>}
          <LoadingButton onClick={startPayment} loading={loading} disabled={!businessId || !plans.some((plan) => plan.name.toLowerCase() === 'pro' && plan.interval === billingInterval)} className="dashboard-primary w-full">Become a Member</LoadingButton>
          </>}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}