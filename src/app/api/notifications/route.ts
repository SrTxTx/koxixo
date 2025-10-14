import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { apiError, withTimeout } from '@/lib/api'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Notif = {
  id: string
  orderId: number
  type: 'CREATED' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'UPDATED'
  message: string
  at: string // ISO date
}

// GET /api/notifications?limit=20
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) {
    return apiError(401, 'Não autorizado')
  }

  try {
    const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
  const sinceRaw = searchParams.get('since')
  const since = sinceRaw ? new Date(sinceRaw) : undefined

    // Buscar pedidos recentes com campos necessários para derivar eventos
    let orders: any[] = []
    try {
      orders = await withTimeout(prisma.order.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100, // buscar um pouco mais para derivar eventos suficientes
        select: {
          id: true,
          createdById: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          createdBy: { select: { name: true } },
          approvedAt: true,
          approvedBy: { select: { name: true } },
          rejectedAt: true,
          rejectedBy: { select: { name: true } },
          rejectionReason: true,
          completedAt: true,
          completedBy: { select: { name: true } },
          deliveredAt: true,
          deliveredBy: { select: { name: true } },
          lastEditedAt: true,
          lastEditedBy: { select: { name: true } },
        },
      }), 8000)
    } catch (err: any) {
      // Fallback para compatibilidade com esquemas mais antigos (sem joins/colunas adicionais)
      logger.warn('Notifications rich query failed, using fallback select:', err?.message || err)
      orders = await withTimeout(prisma.order.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          createdById: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // campos de datas específicas podem não existir, então omitimos no fallback
        },
      }), 8000)
    }

  const userId = parseInt(session.user.id, 10)
  const role = session.user.role as string
  const events: (Notif & { createdById?: number })[] = []

    for (const o of orders) {
      // Criado
      if (o.createdAt) {
        events.push({
          id: `${o.id}-CREATED-${o.createdAt.getTime()}`,
          orderId: o.id,
          type: 'CREATED',
          message: `Novo pedido #${o.id} criado por ${o.createdBy?.name || 'Usuário'}: ${o.title}`,
          at: o.createdAt.toISOString(),
          createdById: o.createdById,
        })
      }
      // Aprovado
      if ((o as any).approvedAt) {
        events.push({
          id: `${o.id}-APPROVED-${(o as any).approvedAt.getTime?.() ?? new Date((o as any).approvedAt).getTime?.()}`,
          orderId: o.id,
          type: 'APPROVED',
          message: `Pedido #${o.id} aprovado${(o as any).approvedBy?.name ? ` por ${(o as any).approvedBy.name}` : ''}`,
          at: ((o as any).approvedAt?.toISOString?.() ?? new Date((o as any).approvedAt).toISOString?.()) || new Date().toISOString(),
          createdById: o.createdById,
        })
      }
      // Rejeitado
      if ((o as any).rejectedAt) {
        events.push({
          id: `${o.id}-REJECTED-${(o as any).rejectedAt.getTime?.() ?? new Date((o as any).rejectedAt).getTime?.()}`,
          orderId: o.id,
          type: 'REJECTED',
          message: `Pedido #${o.id} rejeitado${(o as any).rejectedBy?.name ? ` por ${(o as any).rejectedBy.name}` : ''}${(o as any).rejectionReason ? `: ${(o as any).rejectionReason}` : ''}`,
          at: ((o as any).rejectedAt?.toISOString?.() ?? new Date((o as any).rejectedAt).toISOString?.()) || new Date().toISOString(),
          createdById: o.createdById,
        })
      }
      // Em produção
      if (o.status === 'IN_PROGRESS' && o.updatedAt) {
        events.push({
          id: `${o.id}-IN_PROGRESS-${o.updatedAt.getTime()}`,
          orderId: o.id,
          type: 'IN_PROGRESS',
          message: `Produção iniciada para o pedido #${o.id}`,
          at: o.updatedAt.toISOString(),
          createdById: o.createdById,
        })
      }
      // Concluído
      if ((o as any).completedAt) {
        events.push({
          id: `${o.id}-COMPLETED-${(o as any).completedAt.getTime?.() ?? new Date((o as any).completedAt).getTime?.()}`,
          orderId: o.id,
          type: 'COMPLETED',
          message: `Produção concluída do pedido #${o.id}${(o as any).completedBy?.name ? ` por ${(o as any).completedBy.name}` : ''}`,
          at: ((o as any).completedAt?.toISOString?.() ?? new Date((o as any).completedAt).toISOString?.()) || new Date().toISOString(),
          createdById: o.createdById,
        })
      }
      // Entregue
      if ((o as any).deliveredAt) {
        events.push({
          id: `${o.id}-DELIVERED-${(o as any).deliveredAt.getTime?.() ?? new Date((o as any).deliveredAt).getTime?.()}`,
          orderId: o.id,
          type: 'DELIVERED',
          message: `Pedido #${o.id} entregue${(o as any).deliveredBy?.name ? ` por ${(o as any).deliveredBy.name}` : ''}`,
          at: ((o as any).deliveredAt?.toISOString?.() ?? new Date((o as any).deliveredAt).toISOString?.()) || new Date().toISOString(),
          createdById: o.createdById,
        })
      }
      // Editado
      if ((o as any).lastEditedAt) {
        events.push({
          id: `${o.id}-UPDATED-${(o as any).lastEditedAt.getTime?.() ?? new Date((o as any).lastEditedAt).getTime?.()}`,
          orderId: o.id,
          type: 'UPDATED',
          message: `Pedido #${o.id} atualizado${(o as any).lastEditedBy?.name ? ` por ${(o as any).lastEditedBy.name}` : ''}`,
          at: ((o as any).lastEditedAt?.toISOString?.() ?? new Date((o as any).lastEditedAt).toISOString?.()) || new Date().toISOString(),
          createdById: o.createdById,
        })
      }
    }

    // Filtrar por papel do usuário para reduzir ruído
    const filtered = events.filter((e) => {
      switch (role) {
        case 'ADMIN':
          return true
        case 'VENDEDOR':
          return e.createdById === userId
        case 'ORCAMENTO':
          return e.type === 'CREATED' || e.type === 'APPROVED' || e.type === 'REJECTED' || e.type === 'UPDATED'
        case 'PRODUCAO':
          return e.type === 'APPROVED' || e.type === 'IN_PROGRESS' || e.type === 'COMPLETED'
        default:
          return true
      }
    })

    // Filtrar por since (eventos mais novos que o timestamp informado)
    const bySince = since && !isNaN(since.getTime())
      ? filtered.filter(e => new Date(e.at).getTime() > since.getTime())
      : filtered

    // Ordenar por data desc e limitar
    bySince.sort((a, b) => (a.at > b.at ? -1 : a.at < b.at ? 1 : 0))
    const items = bySince.slice(0, limit).map(({ createdById, ...rest }) => rest)

    return NextResponse.json({ items })
  } catch (error: any) {
    logger.error('Erro ao listar notificações:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao carregar notificações' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}
