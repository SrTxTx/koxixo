import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT: Editar pedido
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { title, description, priority, value } = await req.json()
    const orderId = parseInt(params.id)
    const userRole = session.user.role

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verificar permissões - apenas pedidos PENDING ou REJECTED podem ser editados
    if (!['PENDING', 'REJECTED'].includes(existingOrder.status)) {
      return NextResponse.json({ 
        error: 'Apenas pedidos pendentes ou rejeitados podem ser editados' 
      }, { status: 403 })
    }

    // Verificar se o usuário tem permissão para editar
    if (!['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(userRole)) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para editar pedidos' 
      }, { status: 403 })
    }

    // VENDEDOR só pode editar seus próprios pedidos
    if (userRole === 'VENDEDOR' && existingOrder.createdById !== parseInt(session.user.id)) {
      return NextResponse.json({ 
        error: 'Vendedores só podem editar seus próprios pedidos' 
      }, { status: 403 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        title,
        description: description || null,
        priority,
        value: value ? parseFloat(value) : null,
        lastEditedById: parseInt(session.user.id),
        lastEditedAt: new Date(),
      },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pedido editado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao editar pedido:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PATCH: Atualizar status do pedido
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { action, rejectionReason } = await req.json()
    const orderId = parseInt(params.id)
    const userId = parseInt(session.user.id, 10)
    const userRole = session.user.role

    if (isNaN(orderId) || isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        // ADMIN e ORÇAMENTO podem aprovar
        if (!['ADMIN', 'ORCAMENTO'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou orçamento podem aprovar pedidos' }, { status: 403 })
        }
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: userId,
        }
        break

      case 'reject':
        // ADMIN e ORÇAMENTO podem rejeitar
        if (!['ADMIN', 'ORCAMENTO'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou orçamento podem rejeitar pedidos' }, { status: 403 })
        }
        updateData = {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedById: userId,
          rejectionReason: rejectionReason || 'Sem motivo especificado',
        }
        break

      case 'start_production':
        // ADMIN e PRODUÇÃO podem iniciar produção em pedidos aprovados
        if (!['ADMIN', 'PRODUCAO'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou produção podem iniciar a produção' }, { status: 403 })
        }
        updateData = {
          status: 'IN_PROGRESS',
        }
        break

      case 'complete':
        // ADMIN e PRODUÇÃO podem finalizar produção
        if (!['ADMIN', 'PRODUCAO'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou produção podem finalizar pedidos' }, { status: 403 })
        }
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: userId,
        }
        break

      case 'deliver':
        // ADMIN e VENDEDOR podem marcar como entregue
        if (!['ADMIN', 'VENDEDOR'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou vendedor podem marcar como entregue' }, { status: 403 })
        }
        updateData = {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          deliveredById: userId,
        }
        break

      case 'resubmit':
        // ADMIN e VENDEDOR podem reenviar pedidos rejeitados para aprovação
        if (!['ADMIN', 'VENDEDOR'].includes(userRole)) {
          return NextResponse.json({ error: 'Apenas admin ou vendedor podem reenviar pedidos para aprovação' }, { status: 403 })
        }
        updateData = {
          status: 'PENDING',
          // Limpar dados de rejeição
          rejectedAt: null,
          rejectedById: null,
          rejectionReason: null,
        }
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { createdBy: { select: { name: true } } },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}