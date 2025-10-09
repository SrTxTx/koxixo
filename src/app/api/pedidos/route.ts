import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, withTimeout } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET: Listar todos os pedidos
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError(401, 'Não autorizado')

  try {
    const { searchParams } = new URL(req.url)
    // Pagination
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSizeRaw = parseInt(searchParams.get('pageSize') || '0', 10)
    const pageSize = pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 0 // 0 = sem paginação explícita
    const skip = pageSize ? (page - 1) * pageSize : 0
    const take = pageSize || undefined

    // Sorting (whitelist)
    const allowedSort = new Set(['createdAt', 'updatedAt', 'value', 'priority', 'status', 'title'])
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const orderBy = allowedSort.has(sortBy) ? { [sortBy]: sortDir } as any : { createdAt: 'desc' as const }

    // Filters
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const search = searchParams.get('search') || ''
    const searchIn = searchParams.get('searchIn') || 'title' // title|description|both
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const range = searchParams.get('range') // today|week|month

    const parseDate = (v?: string | null) => {
      if (!v) return undefined
      const d = new Date(v)
      return isNaN(d.getTime()) ? undefined : d
    }

    let dateFrom = parseDate(startDate)
    let dateTo = parseDate(endDate)
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
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }
    if (createdBy) {
      const users = await prisma.user.findMany({
        where: { name: { contains: createdBy, mode: 'insensitive' } },
        select: { id: true },
      })
      const ids = users.map(u => u.id)
      where.createdById = ids.length ? { in: ids } : -1
    }
    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const }
      if (searchIn === 'description') {
        where.OR = [{ description: contains }]
      } else if (searchIn === 'both') {
        where.OR = [{ title: contains }, { description: contains }]
      } else {
        where.title = contains
      }
    }

    const [orders, total] = await Promise.all([
      withTimeout(prisma.order.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          value: true,
          createdAt: true,
          lastEditedAt: true,
          rejectionReason: true,
          rejectedAt: true,
          createdBy: { select: { name: true } },
          lastEditedBy: { select: { name: true } },
          rejectedBy: { select: { name: true } },
        },
      }), 8000),
      withTimeout(prisma.order.count({ where }), 8000),
    ])

    // Preservar forma de resposta atual (array) para não quebrar a UI.
    const res = NextResponse.json(orders)
    res.headers.set('X-Total-Count', String(total))
    if (pageSize) {
      res.headers.set('X-Page', String(page))
      res.headers.set('X-Page-Size', String(pageSize))
    }
    return res
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao consultar pedidos. Tente novamente.' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}

// POST: Criar um novo pedido
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)) {
    return apiError(403, 'Acesso negado')
  }

  try {
    const body = await req.json()
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      value: z.union([z.number(), z.string()]).optional().nullable(),
      priority: z.string().optional(),
      dueDate: z.string().datetime().optional().nullable(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError(400, 'Entrada inválida', { message: parsed.error.message })
    const { title, description, value, priority, dueDate } = parsed.data

    console.log('Recebido para criar pedido:', body) // Log para depuração

    if (!title || !description || !String(title).trim() || !String(description).trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 })
    }

    // Validação robusta dos campos opcionais
    const finalValue = (value !== null && value !== '' && !isNaN(parseFloat(value as string))) ? parseFloat(value as string) : null
  const finalDueDate = (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') ? new Date(dueDate) : null

    // Normalizar prioridade
    const allowedPriorities = ['HIGH', 'MEDIUM', 'LOW'] as const
    let safePriority = typeof priority === 'string' ? priority.toUpperCase() : ''
    if (safePriority === 'NORMAL') safePriority = 'MEDIUM'
    if (!allowedPriorities.includes(safePriority as any)) {
      safePriority = 'MEDIUM'
    }

    const createdById = parseInt(session.user.id, 10)
    if (isNaN(createdById)) {
        return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 })
    }

    const order = await withTimeout(prisma.order.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        value: finalValue,
        priority: safePriority,
        status: 'PENDING',
        createdById: createdById,
        dueDate: finalDueDate,
      },
    }), 8000)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Erro detalhado ao criar pedido:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao criar pedido. Tente novamente.' })
    }
    return apiError(500, 'Erro interno do servidor ao processar o pedido.', { message: error?.message })
  }
}
