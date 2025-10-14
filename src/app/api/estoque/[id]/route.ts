import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { executeWithRetry } from '@/lib/db-config'

// GET /api/estoque/[id] -> detalhes do produto
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const product = await executeWithRetry(async () => prisma.product.findUnique({ where: { id } }))
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  return NextResponse.json(product)
}

// POST /api/estoque/[id] -> criar movimentação de estoque (IN/OUT/ADJUST)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!['ADMIN', 'ORCAMENTO', 'PRODUCAO'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const { type, quantity, reason, orderId } = body || {}
  if (!type || !['IN', 'OUT', 'ADJUST'].includes(type)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty === 0) return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 })

  return await executeWithRetry(async () => {
    const userId = parseInt(String(session.user.id), 10)
    const safeUserId = Number.isFinite(userId) ? userId : undefined
    return await (prisma as any).$transaction(async (tx: any) => {
      const product = await tx.product.findUnique({ where: { id } })
      if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

      let newStock = product.currentStock
      if (type === 'IN') newStock += Math.abs(qty)
      else if (type === 'OUT') newStock -= Math.abs(qty)
  else if (type === 'ADJUST') newStock = Math.abs(qty) // ajuste direto para valor absoluto

      if (newStock < 0) return NextResponse.json({ error: 'Estoque não pode ficar negativo' }, { status: 400 })

      const movement = await tx.stockMovement.create({
        data: {
          type,
          quantity: type === 'ADJUST' ? newStock : Math.abs(qty),
          reason,
          productId: id,
          createdById: safeUserId,
          orderId: orderId ? Number(orderId) : undefined,
        },
      })

      const updated = await tx.product.update({
        where: { id },
        data: { currentStock: newStock, updatedById: safeUserId },
      })

      return NextResponse.json({ product: updated, movement }, { status: 201 })
    })
  })
}

// PUT /api/estoque/[id] -> atualizar informações do produto
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!['ADMIN', 'ORCAMENTO'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const { sku, name, description, unit, price, minStock } = body || {}

  if (!sku && !name && !unit && price === undefined && minStock === undefined && !description) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  try {
    const userId = parseInt(String(session.user.id), 10)
    const safeUserId = Number.isFinite(userId) ? userId : undefined

    const updateData: any = { updatedById: safeUserId }
    if (sku) updateData.sku = sku
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (unit) updateData.unit = unit
    if (price !== undefined) updateData.price = Number(price)
    if (minStock !== undefined) updateData.minStock = Number(minStock)

    const product = await executeWithRetry(async () => {
      return prisma.product.update({
        where: { id },
        data: updateData,
      })
    })

    return NextResponse.json(product)
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU já existe' }, { status: 400 })
    }
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar produto', message: e?.message }, { status: 500 })
  }
}
