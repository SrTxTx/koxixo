import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Força a rota a ser dinâmica para evitar problemas de renderização estática
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar estatísticas do banco
    const totalOrders = await prisma.order.count()
    
    const cancelledOrders = await prisma.order.count({
      where: { status: 'CANCELLED' }
    })
    
    const approvedOrders = await prisma.order.count({
      where: { status: 'APPROVED' }
    })
    
    // Pedidos atrasados (prazo vencido e não concluído)
    const lateOrders = await prisma.order.count({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    })

    return NextResponse.json({
      totalOrders,
      cancelledOrders,
      approvedOrders,
      lateOrders
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}