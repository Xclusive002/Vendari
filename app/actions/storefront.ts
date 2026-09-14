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