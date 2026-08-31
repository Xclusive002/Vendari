import { NextResponse } from 'next/server'

const ACCESS_TOKEN_MAX_AGE = 15 * 60
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST(request: Request) {
  const { access, refresh } = await request.json()
  const response = NextResponse.json({ success: true })
  response.cookies.set('vendari_access', access, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE })
  response.cookies.set('vendari_refresh', refresh, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('vendari_access')
  response.cookies.delete('vendari_refresh')
  return response
}