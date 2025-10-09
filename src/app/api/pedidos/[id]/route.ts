import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { apiError, withTimeout, can } from '@/lib/api'

export const dynamic = 'force-dynamic'

// PUT: Editar pedido
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return apiError(401, 'Não autorizado')
  }

  try {
    const body = await req.json()
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['LOW','MEDIUM','HIGH']).optional(),
      value: z.union([z.string(), z.number()]).optional().nullable(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Entrada inválida', issues: parsed.error.flatten() }, { status: 400 })
    }
    const { title, description, priority, value } = parsed.data
    const orderId = parseInt(params.id)
    const userRole = session.user.role

    if (isNaN(orderId)) return apiError(400, 'ID inválido')

    // Verificar se o pedido existe
    const existingOrder = await withTimeout(prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    }), 8000)

    if (!existingOrder) {
      return apiError(404, 'Pedido não encontrado')
    }

    // Verificar permissões - apenas pedidos PENDING ou REJECTED podem ser editados
    if (!['PENDING', 'REJECTED'].includes(existingOrder.status)) {
      return apiError(403, 'Apenas pedidos pendentes ou rejeitados podem ser editados')
    }

    // Verificar se o usuário tem permissão para editar
    if (!['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(userRole)) {
      return apiError(403, 'Você não tem permissão para editar pedidos')
    }

    // VENDEDOR só pode editar seus próprios pedidos
    if (!can.editOrder(userRole as any, existingOrder.createdById, parseInt(session.user.id, 10), existingOrder.status)) {
      return apiError(403, 'Vendedores só podem editar seus próprios pedidos')
    }

    const updatedOrder = await withTimeout(prisma.order.update({
      where: { id: orderId },
      data: {
        title,
        description: description || null,
        priority,
        value: value ? parseFloat(String(value)) : null,
        lastEditedById: parseInt(session.user.id),
        lastEditedAt: new Date(),
      },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      }
    }), 8000)

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pedido editado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao editar pedido:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao editar pedido. Tente novamente.' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}

// PATCH: Atualizar status do pedido
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return apiError(401, 'Não autorizado')
  }

  try {
    const body = await req.json()
    const schema = z.object({
      action: z.enum(['approve','reject','start_production','complete','deliver','resubmit']),
      rejectionReason: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Entrada inválida', issues: parsed.error.flatten() }, { status: 400 })
    }
    const { action, rejectionReason } = parsed.data
    const orderId = parseInt(params.id)
    const userId = parseInt(session.user.id, 10)
    const userRole = session.user.role

    if (isNaN(orderId) || isNaN(userId)) return apiError(400, 'ID inválido')

    let updateData: any = {}

    switch (action) {
      case 'approve':
        // ADMIN e ORÇAMENTO podem aprovar
        if (!can.approveOrder(userRole as any)) return apiError(403, 'Apenas admin ou orçamento podem aprovar pedidos')
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: userId,
        }
        break

      case 'reject':
        // ADMIN e ORÇAMENTO podem rejeitar
        if (!can.rejectOrder(userRole as any)) return apiError(403, 'Apenas admin ou orçamento podem rejeitar pedidos')
        updateData = {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedById: userId,
          rejectionReason: rejectionReason || 'Sem motivo especificado',
        }
        break

      case 'start_production':
        // ADMIN e PRODUÇÃO podem iniciar produção em pedidos aprovados
        if (!can.startProduction(userRole as any)) return apiError(403, 'Apenas admin ou produção podem iniciar a produção')
        updateData = {
          status: 'IN_PROGRESS',
        }
        break

      case 'complete':
        // ADMIN e PRODUÇÃO podem finalizar produção
        if (!can.completeProduction(userRole as any)) return apiError(403, 'Apenas admin ou produção podem finalizar pedidos')
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: userId,
        }
        break

      case 'deliver':
        // ADMIN e VENDEDOR podem marcar como entregue
        if (!can.deliverOrder(userRole as any)) return apiError(403, 'Apenas admin ou vendedor podem marcar como entregue')
        updateData = {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          deliveredById: userId,
        }
        break

      case 'resubmit':
        // ADMIN e VENDEDOR podem reenviar pedidos rejeitados para aprovação
        if (!can.resubmitOrder(userRole as any)) return apiError(403, 'Apenas admin ou vendedor podem reenviar pedidos para aprovação')
        updateData = {
          status: 'PENDING',
          // Limpar dados de rejeição
          rejectedAt: null,
          rejectedById: null,
          rejectionReason: null,
        }
        break

      default:
        return apiError(400, 'Ação inválida')
    }

    const order = await withTimeout(prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { createdBy: { select: { name: true } } },
    }), 8000)

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return apiError(500, 'Erro interno do servidor')
  }
}