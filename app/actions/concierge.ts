'use server'

import { apiJson } from '@/lib/api-client'

export type ConciergeInquiryData = {
  name: string
  business_name: string
  phone: string
  interest: string
}

export async function submitConciergeInquiry(data: ConciergeInquiryData) {
  try {
    return await apiJson('/api/concierge-inquiries/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to submit inquiry' }
  }
}
