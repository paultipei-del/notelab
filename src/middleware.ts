import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = process.env.SITE_PASSWORD ?? 'notelab2025'
const COOKIE = 'nl-access'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the unlock endpoint and static assets through
  if (pathname === '/unlock' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check cookie
  if (request.cookies.get(COOKIE)?.value === PASSWORD) {
    return NextResponse.next()
  }

  // Redirect to unlock page
  const url = request.nextUrl.clone()
  url.pathname = '/unlock'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
