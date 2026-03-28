import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = process.env.SITE_PASSWORD ?? 'notelab2025'
const COOKIE = 'nl-access'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let static assets, api, and unlock page through unconditionally
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/unlock') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check access cookie
  if (request.cookies.get(COOKIE)?.value === PASSWORD) {
    return NextResponse.next()
  }

  // Gate — redirect to unlock
  const url = request.nextUrl.clone()
  url.pathname = '/unlock'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/(.*)',
}
