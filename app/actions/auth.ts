'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { apiJson } from '@/lib/api-client'

export async function register(email: string, password: string, business_name: string) {
  try {
    const data = await apiJson('/api/auth/register/', { method: 'POST', body: JSON.stringify({ email, password, business_name }), skipRefresh: true })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
  }
}

export async function verifyEmail(token: string) {
  try {
    const data = await apiJson('/api/auth/verify-email/', { method: 'POST', body: JSON.stringify({ token }), skipRefresh: true })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Verification failed' }
  }
}

export async function login(email: string, password: string) {
  try {
    const tokens = await apiJson<{ access: string; refresh: string }>('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }), skipRefresh: true })
    const cookieStore = await cookies()
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
    cookieStore.set('vendari_access', tokens.access, { ...options, maxAge: 15 * 60 })
    cookieStore.set('vendari_refresh', tokens.refresh, { ...options, maxAge: 7 * 24 * 60 * 60 })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
  }
}

export async function getCurrentUser() {
  return null
}

export async function getBusiness() {
  try {
    const businesses = await apiJson<any[]>('/api/businesses/')
    return businesses[0] ? { ...businesses[0], business_name: businesses[0].name } : null
  } catch {
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('vendari_access')
  cookieStore.delete('vendari_refresh')
  redirect('/login')
}
