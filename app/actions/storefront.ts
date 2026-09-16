'use server'

import { apiJson } from '@/lib/api-client'

export type StorefrontCheckoutPayload = {
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_option: string
  checkout_method: 'whatsapp' | 'pay_now'
  items: Array<{ product_name: string; quantity: number }>
}

export async function checkoutStorefront(slug: string, payload: StorefrontCheckoutPayload) {
  try {
    return {
      success: true as const,
      data: await apiJson<{ order_id: number; whatsapp_url?: string; authorization_url?: string }>(
        `/storefronts/${encodeURIComponent(slug)}/checkout/`,
        { method: 'POST', body: JSON.stringify(payload), skipRefresh: true },
      ),
    }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Checkout failed.' }
  }
}

export async function getStorefrontOrders(businessId: string) {
  try {
    return { success: true as const, data: await apiJson<Array<{ id: number; customer_name: string; status: string; payout_status: 'pending' | 'settled' | 'failed'; settled_at: string | null; created_at: string; total: string | number; line_items: Array<{ product_name: string; quantity: number; unit_price: string | number; line_total: string | number }> }>>(`/businesses/${businessId}/storefront-orders/`) }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Unable to load storefront orders.', data: [] }
  }
}

export async function getPayouts(businessId: string) {
  try {
    return { success: true as const, data: await apiJson<{ summary: { total_settled: number; total_pending: number; count: number }; payouts: Array<{ id: string | number; amount: number; status: string; created_at: string | null; paid_at: string | null; settlement_date: string | null; reference: string | null; subaccount_code: string | null; currency: string | null; }> }>(`/businesses/${businessId}/payouts/`) }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Unable to load payout history.' }
  }
}