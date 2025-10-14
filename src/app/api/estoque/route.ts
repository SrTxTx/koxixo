import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { executeWithRetry } from '@/lib/db-config'

// GET /api/estoque -> lista produtos com paginação e busca
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || undefined
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')))

  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { sku: { contains: q, mode: 'insensitive' as const } }] }
    : {}

  const [items, total] = await executeWithRetry(async () => {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ])
    return [items, total] as const
  })

  return NextResponse.json({ items, total, page, pageSize })
}

// POST /api/estoque -> cria produto
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!['ADMIN', 'ORCAMENTO', 'PRODUCAO', 'VENDEDOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { sku, name, description, unit = 'UN', price = 0, minStock = 0, currentStock = 0 } = body || {}
  if (!sku || !name) return NextResponse.json({ error: 'sku e name são obrigatórios' }, { status: 400 })

  try {
    const userId = parseInt(String(session.user.id), 10)
    const safeUserId = Number.isFinite(userId) ? userId : null
    const product = await executeWithRetry(async () => {
      return prisma.product.create({
        data: {
          sku,
          name,
          description,
          unit,
          price,
          minStock,
          currentStock,
          createdById: safeUserId ?? undefined,
          updatedById: safeUserId ?? undefined,
        },
      })
    })
    return NextResponse.json(product, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU já existe' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar produto', message: e?.message }, { status: 500 })
  }
}
