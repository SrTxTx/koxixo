import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, withTimeout } from '@/lib/api'
import { getSignedUploadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// POST /api/attachments/signed { orderId, filename, contentType }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError(401, 'Não autorizado')
  const body = await req.json().catch(() => null)
  if (!body) return apiError(400, 'Corpo inválido')
  const { orderId, filename, contentType } = body
  if (!orderId || !filename || !contentType) return apiError(400, 'Parâmetros obrigatórios ausentes')
  const key = `orders/${orderId}/${Date.now()}-${filename}`
  const signed = await getSignedUploadUrl(key, contentType)
  return NextResponse.json({ key, upload: signed })
}

// PUT /api/attachments -> cria registro após upload concluído
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError(401, 'Não autorizado')
  const userId = parseInt(session.user.id, 10)
  const body = await req.json().catch(() => null)
  if (!body) return apiError(400, 'Corpo inválido')
  const { orderId, key, url, filename, contentType, size } = body
  if (!orderId || !key || !url || !filename || !contentType || !size) return apiError(400, 'Parâmetros obrigatórios ausentes')
  const att = await withTimeout((prisma as any).attachment.create({
    data: { orderId, key, url, filename, contentType, size, createdById: userId },
  }), 8000)
  return NextResponse.json(att, { status: 201 })
}
