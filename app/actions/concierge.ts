'use server'

import { apiJson } from '@/lib/api-client'

export type ConciergeInquiryData = {
  name: string
  business_name: string
  phone: string
  interest: string
}

type ConciergeInquiryResult = { success: true } | { error: string }

export async function submitConciergeInquiry(data: ConciergeInquiryData): Promise<ConciergeInquiryResult> {
  try {
    await apiJson('/api/concierge-inquiries/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to submit inquiry' }
  }
}
