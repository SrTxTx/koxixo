import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { apiError, withTimeout, can } from '@/lib/api'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// PUT: Editar pedido
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
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
      // Campos de cortinas
      clientName: z.string().optional().nullable(),
      sellerName: z.string().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      isReto: z.boolean().optional(),
      isSemiReto: z.boolean().optional(),
      isComPregas: z.boolean().optional(),
      isViraPau: z.boolean().optional(),
      isIlhos: z.boolean().optional(),
      isIlhosEscondidos: z.boolean().optional(),
      isOutroAcabamento: z.boolean().optional(),
      outroAcabamento: z.string().optional().nullable(),
      isPorAltura: z.boolean().optional(),
      isPorMetrosCorridos: z.boolean().optional(),
      isPostico: z.boolean().optional(),
      isAbertoAoMeio: z.boolean().optional(),
      isEncaparCos: z.boolean().optional(),
      observations: z.string().optional().nullable(),
      isTrilho: z.boolean().optional(),
      isTrilhoCurvo: z.boolean().optional(),
      isVaraoVazado: z.boolean().optional(),
      isVaraGrossa: z.boolean().optional(),
      isVaraMedia: z.boolean().optional(),
      isCromado: z.boolean().optional(),
      isAcoEscovado: z.boolean().optional(),
      isPreto: z.boolean().optional(),
      isBranco: z.boolean().optional(),
      isBege: z.boolean().optional(),
      isTabaco: z.boolean().optional(),
      materials: z.any().optional(),
      installationStatus: z.string().optional().nullable(),
      seamstressName: z.string().optional().nullable(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Entrada inválida', issues: parsed.error.flatten() }, { status: 400 })
    }
    const { title, description, priority, value, ...curtainFields } = parsed.data
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
        // Campos de cortinas
        clientName: curtainFields.clientName ?? undefined,
        sellerName: curtainFields.sellerName ?? undefined,
        width: curtainFields.width ?? undefined,
        height: curtainFields.height ?? undefined,
        isReto: curtainFields.isReto ?? undefined,
        isSemiReto: curtainFields.isSemiReto ?? undefined,
        isComPregas: curtainFields.isComPregas ?? undefined,
        isViraPau: curtainFields.isViraPau ?? undefined,
        isIlhos: curtainFields.isIlhos ?? undefined,
        isIlhosEscondidos: curtainFields.isIlhosEscondidos ?? undefined,
        isOutroAcabamento: curtainFields.isOutroAcabamento ?? undefined,
        outroAcabamento: curtainFields.outroAcabamento ?? undefined,
        isPorAltura: curtainFields.isPorAltura ?? undefined,
        isPorMetrosCorridos: curtainFields.isPorMetrosCorridos ?? undefined,
        isPostico: curtainFields.isPostico ?? undefined,
        isAbertoAoMeio: curtainFields.isAbertoAoMeio ?? undefined,
        isEncaparCos: curtainFields.isEncaparCos ?? undefined,
        observations: curtainFields.observations ?? undefined,
        isTrilho: curtainFields.isTrilho ?? undefined,
        isTrilhoCurvo: curtainFields.isTrilhoCurvo ?? undefined,
        isVaraoVazado: curtainFields.isVaraoVazado ?? undefined,
        isVaraGrossa: curtainFields.isVaraGrossa ?? undefined,
        isVaraMedia: curtainFields.isVaraMedia ?? undefined,
        isCromado: curtainFields.isCromado ?? undefined,
        isAcoEscovado: curtainFields.isAcoEscovado ?? undefined,
        isPreto: curtainFields.isPreto ?? undefined,
        isBranco: curtainFields.isBranco ?? undefined,
        isBege: curtainFields.isBege ?? undefined,
        isTabaco: curtainFields.isTabaco ?? undefined,
        materials: curtainFields.materials ?? undefined,
        installationStatus: curtainFields.installationStatus ?? undefined,
        seamstressName: curtainFields.seamstressName ?? undefined,
      },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      }
    }), 8000)

    // Auditoria
    await auditLog({
      userId: parseInt(session.user.id, 10),
      action: 'ORDER_UPDATE',
      entity: 'Order',
      entityId: updatedOrder.id,
      from: { title: existingOrder.title, description: existingOrder.description, priority: existingOrder.priority, value: existingOrder.value },
      to: { title: updatedOrder.title, description: updatedOrder.description, priority: updatedOrder.priority, value: updatedOrder.value },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pedido editado com sucesso'
    })

  } catch (error: any) {
    logger.error('Erro ao editar pedido:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao editar pedido. Tente novamente.' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}

// PATCH: Atualizar status do pedido
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
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

    // Buscar estado anterior para auditoria
    const before = await withTimeout(prisma.order.findUnique({ where: { id: orderId }, select: { status: true } }), 8000)
    const order = await withTimeout(prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { createdBy: { select: { name: true } } },
    }), 8000)

    // Auditoria
    await auditLog({
      userId,
      action: 'ORDER_STATUS',
      entity: 'Order',
      entityId: orderId,
      from: { status: before?.status },
      to: { status: order.status },
      meta: { action },
    })

    return NextResponse.json(order)
  } catch (error) {
    logger.error('Erro ao atualizar pedido:', error)
    return apiError(500, 'Erro interno do servidor')
  }
}