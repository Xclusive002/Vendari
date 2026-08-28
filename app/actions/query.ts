'use server'

import { apiJson } from '@/lib/api-client'

export async function askBusiness(businessId: string, question: string) {
  try {
    return await apiJson<{ answer: string; data_used: Record<string, unknown> }>(`/businesses/${businessId}/ask/`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to answer question' }
  }
}