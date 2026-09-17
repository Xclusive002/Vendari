import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const authRoutes = ['/login', '/register', '/verify-email']
const protectedRoutes = ['/dashboard']

function hasValidAccessCookie(value?: string) {
  if (!value) return false
  try {
    const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessCookie = request.cookies.get('vendari_access')?.value
  const hasAccess = hasValidAccessCookie(accessCookie)
  const response = NextResponse.next()

  if (accessCookie && !hasAccess) {
    response.cookies.delete('vendari_access')
  }

  if (pathname === '/' && hasAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (hasAccess && authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!hasAccess && protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}