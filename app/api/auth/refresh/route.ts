import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const refresh = (await cookies()).get('vendari_refresh')?.value
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
  if (!refresh || !baseUrl) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const djangoResponse = await fetch(`${baseUrl}/auth/token/refresh/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }), cache: 'no-store',
  })
  if (!djangoResponse.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tokens = await djangoResponse.json()
  const response = NextResponse.json({ success: true })
  response.cookies.set('vendari_access', tokens.access, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 15 * 60,
  })
  return response
}