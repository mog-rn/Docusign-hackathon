import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that should bypass middleware
const PUBLIC_FILE_PATTERNS = [
  /^\/(_next|static)\/.*/,  // Next.js static files
  /^\/favicon\.ico/,        // Favicon
  /\.(jpg|jpeg|png|gif|svg)$/,  // Images
];

// Define public and protected routes
// const PUBLIC_ROUTES = ['/login', '/register'];
// const PROTECTED_ROUTES = ['/dashboard', '/profile'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and public assets
  if (PUBLIC_FILE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Simple auth check - just verify token exists
  const hasToken = !!request.cookies.get("authToken")?.value;

  // Handle root path redirect
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasToken ? '/dashboard' : '/login', request.url)
    );
  }

  // Protected routes check
  if (pathname.startsWith('/dashboard')) {
    if (!hasToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Prevent authenticated users from accessing login
  if (pathname === '/login' && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};