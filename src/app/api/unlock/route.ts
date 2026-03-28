import { NextResponse } from 'next/server'

const PASSWORD = process.env.SITE_PASSWORD ?? 'notelab2025'
const COOKIE = 'nl-access'

export async function POST(request: Request) {
  const { password } = await request.json()
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
