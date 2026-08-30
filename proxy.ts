import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const authRoutes = ['/login', '/register', '/verify-email']
const protectedRoutes = ['/dashboard']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccess = Boolean(request.cookies.get('vendari_access')?.value)

  if (pathname === '/' && hasAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (hasAccess && authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!hasAccess && protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}