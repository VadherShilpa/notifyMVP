import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth/jwt'

const CLEAR = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
}

/** Clears env-admin JWT and Better Auth session cookies. */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', CLEAR)
  res.cookies.set('better-auth.session_token', '', CLEAR)
  res.cookies.set('better-auth.session_data', '', CLEAR)
  return res
}
