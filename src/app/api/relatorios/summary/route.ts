import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function parseDate(value?: string | null) {
  if (!value) return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const startDate = parseDate(searchParams.get('startDate'))
    const endDate = parseDate(searchParams.get('endDate'))
    const range = searchParams.get('range') || undefined // today | week | month

    let dateFrom = startDate
    let dateTo = endDate
    if (!dateFrom && !dateTo && range) {
      const now = new Date()
      if (range === 'today') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      } else if (range === 'week') {
        const d = new Date(now)
        d.setDate(now.getDate() - 7)
        dateFrom = d
        dateTo = now
      } else if (range === 'month') {
        const d = new Date(now)
        d.setMonth(now.getMonth() - 1)
        dateFrom = d
        dateTo = now
      }
    }

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (createdBy) {
      where.createdBy = { name: { contains: createdBy, mode: 'insensitive' } }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [totalOrders, sumAgg, byStatus, byPriority, groupedCreators, ordersForSeries] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { value: true } }),
      prisma.order.groupBy({ where, by: ['status'], _count: { _all: true } }),
      prisma.order.groupBy({ where, by: ['priority'], _count: { _all: true } }),
      prisma.order.groupBy({ where, by: ['createdById'], _count: { _all: true } }),
      prisma.order.findMany({ where, select: { createdAt: true } })
    ])

    const totalValue = sumAgg._sum.value || 0

    const creatorIds = groupedCreators.map((g) => g.createdById).filter((v): v is number => typeof v === 'number')
    const users = creatorIds.length
      ? await prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } })
      : []
    const userMap = new Map(users.map((u) => [u.id, u.name]))
    const topCreators = groupedCreators
      .map((g) => ({ id: g.createdById, name: userMap.get(g.createdById!) || `Usuário #${g.createdById}`, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Serie por dia
    const seriesMap = new Map<string, number>()
    const addDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    let startForSeries: Date | undefined = dateFrom
    let endForSeries: Date | undefined = dateTo
    if (!startForSeries || !endForSeries) {
      // fallback: últimos 30 dias
      const now = new Date()
      endForSeries = endForSeries || now
      const d = new Date(endForSeries)
      d.setDate(endForSeries.getDate() - 29)
      startForSeries = startForSeries || d
    }
    if (startForSeries && endForSeries) {
      const cursor = new Date(addDay(startForSeries))
      const endDay = new Date(addDay(endForSeries))
      while (cursor <= endDay) {
        seriesMap.set(cursor.toISOString().slice(0, 10), 0)
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    for (const o of ordersForSeries) {
      const key = addDay(o.createdAt).toISOString().slice(0, 10)
      if (seriesMap.has(key)) seriesMap.set(key, (seriesMap.get(key) || 0) + 1)
    }
    const byDay = Array.from(seriesMap.entries()).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      totals: { totalOrders, totalValue },
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count._all })),
      byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count._all })),
      byDay,
      topCreators
    })
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
