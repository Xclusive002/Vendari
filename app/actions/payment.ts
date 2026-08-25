'use server'

import { apiJson } from '@/lib/api-client'

export async function initializePayment(business_id: string, plan_id: string) {
  try {
    const data = await apiJson<{ authorization_url: string; reference: string }>('/api/billing/paystack/initialize/', {
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured')
    const apiOrigin = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
    const response = await fetch(`${apiOrigin}/api/payment/verify/`, {
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