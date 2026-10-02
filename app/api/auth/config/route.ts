import { NextResponse } from 'next/server'
import { getEnvAdminCredentials } from '@/lib/auth/env-admin-login'

/** Public auth UI flags (no secrets). */
export async function GET() {
  let cfEnv: Record<string, string> = {}
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext({ async: true })
    cfEnv = (env as Record<string, string>) || {}
  } catch {}

  const clientId = process.env.GOOGLE_CLIENT_ID || cfEnv.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || cfEnv.GOOGLE_CLIENT_SECRET
  const { email, password } = getEnvAdminCredentials(cfEnv)

  return NextResponse.json({
    googleEnabled: Boolean(clientId && clientSecret),
    envEmailLoginEnabled: Boolean(email && password.length >= 6),
  })
}
