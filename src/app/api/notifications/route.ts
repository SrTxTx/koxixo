import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Notif = {
  id: string
  orderId: number
  type: 'CREATED' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'UPDATED'
  message: string
  at: string // ISO date
}

// GET /api/notifications?limit=20
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    // Buscar pedidos recentes com campos necessários para derivar eventos
    const orders = await prisma.order.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100, // buscar um pouco mais para derivar eventos suficientes
      select: {
        id: true,
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
    })

    const events: Notif[] = []

    for (const o of orders) {
      // Criado
      if (o.createdAt) {
        events.push({
          id: `${o.id}-CREATED-${o.createdAt.getTime()}`,
          orderId: o.id,
          type: 'CREATED',
          message: `Novo pedido #${o.id} criado por ${o.createdBy?.name || 'Usuário'}: ${o.title}`,
          at: o.createdAt.toISOString(),
        })
      }
      // Aprovado
      if (o.approvedAt) {
        events.push({
          id: `${o.id}-APPROVED-${o.approvedAt.getTime()}`,
          orderId: o.id,
          type: 'APPROVED',
          message: `Pedido #${o.id} aprovado${o.approvedBy?.name ? ` por ${o.approvedBy.name}` : ''}`,
          at: o.approvedAt.toISOString(),
        })
      }
      // Rejeitado
      if (o.rejectedAt) {
        events.push({
          id: `${o.id}-REJECTED-${o.rejectedAt.getTime()}`,
          orderId: o.id,
          type: 'REJECTED',
          message: `Pedido #${o.id} rejeitado${o.rejectedBy?.name ? ` por ${o.rejectedBy.name}` : ''}${o.rejectionReason ? `: ${o.rejectionReason}` : ''}`,
          at: o.rejectedAt.toISOString(),
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
        })
      }
      // Concluído
      if (o.completedAt) {
        events.push({
          id: `${o.id}-COMPLETED-${o.completedAt.getTime()}`,
          orderId: o.id,
          type: 'COMPLETED',
          message: `Produção concluída do pedido #${o.id}${o.completedBy?.name ? ` por ${o.completedBy.name}` : ''}`,
          at: o.completedAt.toISOString(),
        })
      }
      // Entregue
      if (o.deliveredAt) {
        events.push({
          id: `${o.id}-DELIVERED-${o.deliveredAt.getTime()}`,
          orderId: o.id,
          type: 'DELIVERED',
          message: `Pedido #${o.id} entregue${o.deliveredBy?.name ? ` por ${o.deliveredBy.name}` : ''}`,
          at: o.deliveredAt.toISOString(),
        })
      }
      // Editado
      if (o.lastEditedAt) {
        events.push({
          id: `${o.id}-UPDATED-${o.lastEditedAt.getTime()}`,
          orderId: o.id,
          type: 'UPDATED',
          message: `Pedido #${o.id} atualizado${o.lastEditedBy?.name ? ` por ${o.lastEditedBy.name}` : ''}`,
          at: o.lastEditedAt.toISOString(),
        })
      }
    }

    // Ordenar por data desc e limitar
    events.sort((a, b) => (a.at > b.at ? -1 : a.at < b.at ? 1 : 0))
    const items = events.slice(0, limit)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
