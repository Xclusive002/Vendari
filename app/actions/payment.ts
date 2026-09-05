'use server'

import { apiJson } from '@/lib/api-client'

export async function getPlans() {
  try {
    return { success: true, data: await apiJson<Array<{ id: number; name: string; amount: number; interval: string; feature_flags: Record<string, boolean> }>>('/billing/plans/') }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to load plans', data: [] }
  }
}

export async function getSubscription(businessId: string) {
  try {
    return { success: true, data: await apiJson<{ plan: string; plan_id: number | null; status: string; renews_at: string | null; feature_flags: Record<string, boolean> }>(`/businesses/${businessId}/subscription/`) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to load subscription' }
  }
}

export async function initializePayment(business_id: string, plan_id: string) {
  try {
    const data = await apiJson<{ authorization_url: string; reference: string }>('/billing/paystack/initialize/', {
      method: 'POST',
      body: JSON.stringify({ business_id: Number(business_id), plan_id: Number(plan_id) }),
    })
    return { success: true, ...data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Payment initialization failed' }
  }
}

export async function verifyPayment(reference: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
    if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured')
    const response = await fetch(`${baseUrl}/payment/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
      cache: 'no-store',
    })
    const data = await response.json()
    return response.ok ? data : { success: false, error: data.error || 'Payment verification failed' }
  } catch {
    return { success: false, error: 'Payment verification failed' }
  }
}