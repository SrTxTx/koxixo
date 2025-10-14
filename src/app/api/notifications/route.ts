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

    // Helpers seguros para datas (alguns ambientes podem devolver string)
    const toDate = (d: any): Date | null => {
      if (!d) return null
      if (d instanceof Date) return d
      const nd = new Date(d)
      return isNaN(nd.getTime()) ? null : nd
    }
    const toISO = (d: any): string => (toDate(d)?.toISOString?.()) || new Date().toISOString()
    const toMs = (d: any): number => (toDate(d)?.getTime?.()) || Date.now()

    for (const o of orders) {
      // Criado
      if ((o as any).createdAt) {
        events.push({
          id: `${o.id}-CREATED-${toMs((o as any).createdAt)}`,
          orderId: o.id,
          type: 'CREATED',
          message: `Novo pedido #${o.id} criado por ${o.createdBy?.name || 'Usuário'}: ${o.title}`,
          at: toISO((o as any).createdAt),
          createdById: o.createdById,
        })
      }
      // Aprovado
      if ((o as any).approvedAt) {
        events.push({
          id: `${o.id}-APPROVED-${toMs((o as any).approvedAt)}`,
          orderId: o.id,
          type: 'APPROVED',
          message: `Pedido #${o.id} aprovado${(o as any).approvedBy?.name ? ` por ${(o as any).approvedBy.name}` : ''}`,
          at: toISO((o as any).approvedAt),
          createdById: o.createdById,
        })
      }
      // Rejeitado
      if ((o as any).rejectedAt) {
        events.push({
          id: `${o.id}-REJECTED-${toMs((o as any).rejectedAt)}`,
          orderId: o.id,
          type: 'REJECTED',
          message: `Pedido #${o.id} rejeitado${(o as any).rejectedBy?.name ? ` por ${(o as any).rejectedBy.name}` : ''}${(o as any).rejectionReason ? `: ${(o as any).rejectionReason}` : ''}`,
          at: toISO((o as any).rejectedAt),
          createdById: o.createdById,
        })
      }
      // Em produção
      if (o.status === 'IN_PROGRESS' && (o as any).updatedAt) {
        events.push({
          id: `${o.id}-IN_PROGRESS-${toMs((o as any).updatedAt)}`,
          orderId: o.id,
          type: 'IN_PROGRESS',
          message: `Produção iniciada para o pedido #${o.id}`,
          at: toISO((o as any).updatedAt),
          createdById: o.createdById,
        })
      }
      // Concluído
      if ((o as any).completedAt) {
        events.push({
          id: `${o.id}-COMPLETED-${toMs((o as any).completedAt)}`,
          orderId: o.id,
          type: 'COMPLETED',
          message: `Produção concluída do pedido #${o.id}${(o as any).completedBy?.name ? ` por ${(o as any).completedBy.name}` : ''}`,
          at: toISO((o as any).completedAt),
          createdById: o.createdById,
        })
      }
      // Entregue
      if ((o as any).deliveredAt) {
        events.push({
          id: `${o.id}-DELIVERED-${toMs((o as any).deliveredAt)}`,
          orderId: o.id,
          type: 'DELIVERED',
          message: `Pedido #${o.id} entregue${(o as any).deliveredBy?.name ? ` por ${(o as any).deliveredBy.name}` : ''}`,
          at: toISO((o as any).deliveredAt),
          createdById: o.createdById,
        })
      }
      // Editado
      if ((o as any).lastEditedAt) {
        events.push({
          id: `${o.id}-UPDATED-${toMs((o as any).lastEditedAt)}`,
          orderId: o.id,
          type: 'UPDATED',
          message: `Pedido #${o.id} atualizado${(o as any).lastEditedBy?.name ? ` por ${(o as any).lastEditedBy.name}` : ''}`,
          at: toISO((o as any).lastEditedAt),
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
