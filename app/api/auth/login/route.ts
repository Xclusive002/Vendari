'use server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { apiJson } from '@/lib/api-client'

const ACCESS_TOKEN_MAX_AGE = 15 * 60
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const tokens = await apiJson<{ access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipRefresh: true,
    })
    const cookieStore = await cookies()
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
    cookieStore.set('vendari_access', tokens.access, { ...options, maxAge: ACCESS_TOKEN_MAX_AGE })
    cookieStore.set('vendari_refresh', tokens.refresh, { ...options, maxAge: REFRESH_TOKEN_MAX_AGE })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }
}
