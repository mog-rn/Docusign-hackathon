import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routes } from './config/routes'
import { checkAuthStatus } from './utils/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = checkAuthStatus(request)

  // Handle root route
  if (pathname === '/') {
    const redirectUrl = isAuthenticated 
      ? routes.auth.default.authenticated 
      : routes.auth.default.unauthenticated

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Check route access
  const isAuthRoute = routes.auth.protected.some(route => pathname.startsWith(route))
  const isPublicRoute = routes.auth.public.some(route => pathname.startsWith(route))

  if (isAuthRoute && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(routes.auth.default.unauthenticated, request.url)
    )
  }

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(
      new URL(routes.auth.default.authenticated, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}