'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { apiJson } from '@/lib/api-client'

export async function register(email: string, password: string, business_name: string) {
  try {
    const data = await apiJson('/auth/register/', { method: 'POST', body: JSON.stringify({ email, password, business_name }), skipRefresh: true })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
  }
}

export async function login(email: string, password: string) {
  try {
    const tokens = await apiJson<{ access: string; refresh: string }>('/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }), skipRefresh: true })
    const cookieStore = await cookies()
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
    cookieStore.set('vendari_access', tokens.access, { ...options, maxAge: 15 * 60 })
    cookieStore.set('vendari_refresh', tokens.refresh, { ...options, maxAge: 7 * 24 * 60 * 60 })
    return { success: true }
  } catch (error) {
    const cookieStore = await cookies()
    cookieStore.delete('vendari_access')
    cookieStore.delete('vendari_refresh')
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
  }
}

export async function getCurrentUser() {
  try {
    return await apiJson<{ email: string; has_seen_welcome: boolean }>('/auth/me/')
  } catch {
    return null
  }
}

export async function markWelcomeSeen() {
  try {
    return await apiJson<{ has_seen_welcome: boolean }>('/auth/mark-welcome-seen/', { method: 'POST' })
  } catch {
    return null
  }
}

export async function getBusiness() {
  try {
    const businesses = await apiJson<any[]>('/businesses/')
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
