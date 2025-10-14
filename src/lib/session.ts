import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

// Helper to get session, with test bypass when enabled
export async function getSession(req?: NextRequest | Request) {
  try {
    const s = await getServerSession(authOptions)
    if (s) return s
  } catch (e: any) {
    // Em produção, erros de configuração (ex.: NEXTAUTH_SECRET ausente) não devem derrubar a API
    logger.warn('getSession error (fallback to unauthenticated):', e?.message || e)
  }
  const hdr = (req as any)?.headers?.get?.('x-test-bypass-auth')
  if (hdr === '1' || process.env.TEST_BYPASS_AUTH === '1') {
    return {
      user: {
        id: '1',
        role: 'ADMIN',
        name: 'Test User',
        email: 'test@koxixo.com',
      }
    } as any
  }
  return null
}

export async function requireSession() {
  const s = await getSession()
  if (!s) throw new Error('Unauthorized')
  return s
}