import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { apiError, withTimeout } from '@/lib/api'
import { logger } from '@/lib/logger'

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
      return apiError(401, 'Não autorizado')
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const validStatus = ['PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','DELIVERED','CANCELLED'] as const
    const validPriority = ['LOW','MEDIUM','HIGH'] as const
    if (status && !validStatus.includes(status as any)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    if (priority && !validPriority.includes(priority as any)) return NextResponse.json({ error: 'Prioridade inválida' }, { status: 400 })
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
    } else if (!dateFrom && !dateTo && !range) {
      // Limite padrão: últimos 90 dias
      const now = new Date()
      const d = new Date(now)
      d.setDate(now.getDate() - 90)
      dateFrom = d
      dateTo = now
    }

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (createdBy) {
      // Encontrar usuários por nome e filtrar por createdById (evita filtros relacionais complexos)
      const users = await prisma.user.findMany({
        where: { name: { contains: createdBy, mode: 'insensitive' } },
        select: { id: true },
      })
      const ids = users.map((u) => u.id)
      where.createdById = ids.length ? { in: ids } : -1 // -1 garante nenhum resultado quando vazio
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

  // Buscar pedidos filtrados uma vez e agregar em memória (janela limitada por padrão)
    let orders: any[] = []
    try {
      orders = await withTimeout(prisma.order.findMany({
        where,
        select: { id: true, status: true, priority: true, value: true, createdAt: true, createdById: true },
      }), 8000)
    } catch (err: any) {
      if ((err?.code || '') === 'P2032' || String(err?.message || '').includes('converting field')) {
        logger.warn('Summary: P2032 detected, using raw SQL fallback')
        orders = await withTimeout(prisma.$queryRaw<any[]>`
          SELECT 
            id,
            status::text AS "status",
            priority::text AS "priority",
            value,
            created_at AS "createdAt",
            created_by_id AS "createdById"
          FROM "orders"
          ORDER BY created_at DESC
          LIMIT 1000
        `, 8000)
      } else {
        throw err
      }
    }

    const totalOrders = orders.length
    const totalValue = orders.reduce((sum, o) => sum + (o.value ?? 0), 0)

    const statusMap = new Map<string, number>()
    const priorityMap = new Map<string, number>()
    const creatorsMap = new Map<number, number>()

    for (const o of orders) {
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1)
      priorityMap.set(o.priority, (priorityMap.get(o.priority) || 0) + 1)
      if (typeof o.createdById === 'number') {
        creatorsMap.set(o.createdById, (creatorsMap.get(o.createdById) || 0) + 1)
      }
    }

    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
    const byPriority = Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count }))

    const creatorIds = Array.from(creatorsMap.keys())
    const users = creatorIds.length
      ? await withTimeout(prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } }), 8000)
      : []
    const userMap = new Map(users.map((u) => [u.id, u.name]))
    const topCreators = Array.from(creatorsMap.entries())
      .map(([id, count]) => ({ id, count, name: userMap.get(id) || `Usuário #${id}` }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Série por dia
    const seriesMap = new Map<string, number>()
    const addDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    let startForSeries: Date | undefined = dateFrom
    let endForSeries: Date | undefined = dateTo
    if (!startForSeries || !endForSeries) {
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
    for (const o of orders) {
      const key = addDay(o.createdAt).toISOString().slice(0, 10)
      if (seriesMap.has(key)) seriesMap.set(key, (seriesMap.get(key) || 0) + 1)
    }
    const byDay = Array.from(seriesMap.entries()).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      totals: { totalOrders, totalValue },
      byStatus,
      byPriority,
      byDay,
      topCreators
    })
  } catch (error: any) {
    logger.error('Erro ao gerar relatórios:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao gerar relatórios' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}
