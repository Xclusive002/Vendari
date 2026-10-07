'use server'

import { apiJson } from '@/lib/api-client'

export async function getReferralDashboardData() {
  return apiJson<any>('/referrals/me/')
}

type ReferralListOptions = {
  referralsPage?: number
  commissionsPage?: number
  payoutsPage?: number
  commissionStatus?: string
  payoutStatus?: string
}

function listPath(path: string, page: number, status?: string) {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (status && status !== 'all') params.set('status', status)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export async function getReferralLists(options: ReferralListOptions = {}) {
  const [referrals, commissions, payouts, banks] = await Promise.all([
    apiJson<any>(listPath('/referrals/referrals/', options.referralsPage || 1)),
    apiJson<any>(listPath('/referrals/commissions/', options.commissionsPage || 1, options.commissionStatus)),
    apiJson<any>(listPath('/referrals/payouts/', options.payoutsPage || 1, options.payoutStatus)),
    apiJson<any[]>('/referrals/banks/'),
  ])
  return { referrals, commissions, payouts, banks }
}

export async function savePayoutAccount(bankCode: string, accountNumber: string, password: string) {
  return apiJson<{ account_name: string; recipient_code: string } >('/referrals/payout-account/', {
    method: 'POST',
    body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber, password }),
  })
}

export async function requestWithdrawal(amount: number) {
  return apiJson<{ status: string; reference?: string; transfer_code?: string }>('/referrals/withdraw/', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}
