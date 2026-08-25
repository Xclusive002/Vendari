import 'server-only'

import { cookies, headers } from 'next/headers'

type ApiOptions = RequestInit & { skipRefresh?: boolean }

function apiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured')
  return `${baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')}${path}`
}

export async function appOrigin() {
  const requestHeaders = await headers()
  return `${requestHeaders.get('x-forwarded-proto') || 'http'}://${requestHeaders.get('host') || 'localhost:3000'}`
}

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { skipRefresh, ...requestOptions } = options
  const access = (await cookies()).get('vendari_access')?.value
  const requestHeaders = new Headers(requestOptions.headers)
  if (access) requestHeaders.set('Authorization', `Bearer ${access}`)
  requestHeaders.set('Content-Type', 'application/json')
  const response = await fetch(apiUrl(path), { ...requestOptions, headers: requestHeaders, cache: 'no-store' })
  if (response.status === 401 && !skipRefresh && await refreshSession()) {
    return apiFetch(path, { ...options, skipRefresh: true })
  }
  return response
}

async function refreshSession() {
  const refresh = (await cookies()).get('vendari_refresh')?.value
  if (!refresh) return false
  const response = await fetch(apiUrl('/api/auth/token/refresh/'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }), cache: 'no-store',
  })
  if (!response.ok) return false
  const tokens = await response.json()
  ;(await cookies()).set('vendari_access', tokens.access, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 15 * 60,
  })
  return true
}

export async function apiJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await apiFetch(path, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload.detail || payload.error || Object.values(payload).flat().join(' ') || 'API request failed'
    throw new Error(String(detail))
  }
  return payload as T
}