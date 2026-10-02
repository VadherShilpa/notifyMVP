import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth/jwt'
import {
  getEnvAdminCredentials,
  resolveUserForEnvAdminLogin,
  verifyEnvAdminLogin,
} from '@/lib/auth/env-admin-login'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

export async function POST(req: NextRequest) {
  let cfEnv: Record<string, string> = {}
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext({ async: true })
    cfEnv = (env as Record<string, string>) || {}
  } catch {}

  const { email: configuredEmail, password: configuredPassword } =
    getEnvAdminCredentials(cfEnv)

  if (!configuredEmail || configuredPassword.length < 6) {
    return NextResponse.json(
      { error: 'Admin email login is not configured (ADMIN_EMAIL / ADMIN_PASSWORD).' },
      { status: 503 }
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  if (!verifyEnvAdminLogin(email, password, cfEnv)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const user = await resolveUserForEnvAdminLogin(db, email, cfEnv)
    const token = await createSessionToken({ userId: user.userId, email: user.email })

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTS)
    return res
  } catch (e) {
    console.error('[env-login]', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
