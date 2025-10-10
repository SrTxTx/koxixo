import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { apiError, withTimeout } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return apiError(401, 'Não autorizado')
  const userId = parseInt(session.user.id, 10)
  const user = await withTimeout((prisma as any).user.findUnique({ where: { id: userId }, select: { preferences: true } }), 8000) as any
  return NextResponse.json((user?.preferences ?? {}) as any)
}

export async function PUT(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return apiError(401, 'Não autorizado')
  const userId = parseInt(session.user.id, 10)
  const body = await req.json().catch(() => ({}))
  const updated = await withTimeout((prisma as any).user.update({ where: { id: userId }, data: { preferences: body }, select: { preferences: true } }), 8000) as any
  return NextResponse.json((updated.preferences ?? {}) as any)
}
