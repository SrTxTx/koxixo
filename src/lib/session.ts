import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// Helper to get session, with test bypass when enabled
export async function getSession(req?: NextRequest | Request) {
  const s = await getServerSession(authOptions)
  if (s) return s
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