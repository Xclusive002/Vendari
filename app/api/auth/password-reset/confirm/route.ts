import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) return NextResponse.json({ detail: 'Password reset is unavailable.' }, { status: 503 })
  const body = await request.text()
  const response = await fetch(`${baseUrl}/auth/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  })
  return NextResponse.json(await response.json(), { status: response.status })
}