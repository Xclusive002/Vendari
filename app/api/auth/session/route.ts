import { NextResponse } from 'next/server'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST(request: Request) {
  const { access, refresh } = await request.json()
  const response = NextResponse.json({ success: true })
  response.cookies.set('vendari_access', access, { ...cookieOptions, maxAge: 15 * 60 })
  response.cookies.set('vendari_refresh', refresh, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('vendari_access')
  response.cookies.delete('vendari_refresh')
  return response
}