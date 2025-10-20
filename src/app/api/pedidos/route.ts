import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { apiError, withTimeout } from '@/lib/api'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/audit'
import { executeWithRetry } from '@/lib/db-config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET: Listar todos os pedidos
export async function GET(req: NextRequest) {
  const session = await getSession(req)
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

    let orders: any[] = []
    let total = 0
    
    try {
      // Executar queries em paralelo com timeout de 15 segundos e retry automático
      const [ordersData, totalData] = await executeWithRetry(async () => {
        return Promise.all([
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
              // Campos de cortinas
              clientName: true,
              sellerName: true,
              width: true,
              height: true,
              isReto: true,
              isSemiReto: true,
              isComPregas: true,
              isViraPau: true,
              isIlhos: true,
              isIlhosEscondidos: true,
              isOutroAcabamento: true,
              outroAcabamento: true,
              isPorAltura: true,
              isPorMetrosCorridos: true,
              isPostico: true,
              isAbertoAoMeio: true,
              isEncaparCos: true,
              observations: true,
              isTrilho: true,
              isTrilhoCurvo: true,
              isVaraoVazado: true,
              isVaraGrossa: true,
              isVaraMedia: true,
              isCromado: true,
              isAcoEscovado: true,
              isPreto: true,
              isBranco: true,
              isBege: true,
              isTabaco: true,
              materials: true,
              installationStatus: true,
              seamstressName: true,
            },
          }), 15000), // Aumentado de 8s para 15s
          withTimeout(prisma.order.count({ where }), 15000),
        ])
      }, 3) // 3 tentativas com retry automático
      orders = ordersData
      total = totalData
    } catch (err: any) {
      // Fallback SQL se P2032 ou outro erro de tipo
      if ((err?.code || '') === 'P2032' || String(err?.message || '').includes('converting field')) {
        logger.warn('GET orders: P2032 detected, using raw SQL fallback')
        // Build dynamic WHERE for raw SQL (simplified - handle common cases)
        const conditions: string[] = []
        const params: any[] = []
        let paramIndex = 1
        
        if (status) {
          conditions.push(`o.status = $${paramIndex}`)
          params.push(status)
          paramIndex++
        }
        if (priority) {
          conditions.push(`o.priority = $${paramIndex}`)
          params.push(priority)
          paramIndex++
        }
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
        const limitClause = take ? `LIMIT ${take}` : ''
        const offsetClause = skip ? `OFFSET ${skip}` : ''
        
        orders = await withTimeout(prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            o.id,
            o.title,
            o.description,
            o.status::text AS "status",
            o.priority::text AS "priority",
            o.value,
            o.created_at AS "createdAt",
            o.last_edited_at AS "lastEditedAt",
            o.rejection_reason AS "rejectionReason",
            o.rejected_at AS "rejectedAt",
            cb.name AS "createdByName",
            leb.name AS "lastEditedByName",
            rb.name AS "rejectedByName"
          FROM "orders" o
          LEFT JOIN "users" cb ON o.created_by_id = cb.id
          LEFT JOIN "users" leb ON o.last_edited_by_id = leb.id
          LEFT JOIN "users" rb ON o.rejected_by_id = rb.id
          ${whereClause}
          ORDER BY o.created_at DESC
          ${limitClause}
          ${offsetClause}
        `, ...params), 15000) // Aumentado de 8s para 15s
        
        // Normalize structure to match Prisma shape
        orders = orders.map((o: any) => ({
          ...o,
          createdBy: o.createdByName ? { name: o.createdByName } : null,
          lastEditedBy: o.lastEditedByName ? { name: o.lastEditedByName } : null,
          rejectedBy: o.rejectedByName ? { name: o.rejectedByName } : null,
        }))
        
        total = orders.length // Approximation for fallback
      } else {
        throw err
      }
    }

    // Preservar forma de resposta atual (array) para não quebrar a UI.
    const res = NextResponse.json(orders)
    res.headers.set('X-Total-Count', String(total))
    if (pageSize) {
      res.headers.set('X-Page', String(page))
      res.headers.set('X-Page-Size', String(pageSize))
    }
    return res
  } catch (error: any) {
  logger.error('Erro ao buscar pedidos:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao consultar pedidos. Tente novamente.' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}

// POST: Criar um novo pedido
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)) {
    return apiError(403, 'Acesso negado')
  }

  try {
    const body = await req.json()
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      value: z.union([z.number(), z.string()]).optional().nullable(),
      priority: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      // Novos campos de cortinas
      clientName: z.string().optional().nullable(),
      sellerName: z.string().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      // Acabamentos
      isReto: z.boolean().optional(),
      isSemiReto: z.boolean().optional(),
      isComPregas: z.boolean().optional(),
      isViraPau: z.boolean().optional(),
      isIlhos: z.boolean().optional(),
      isIlhosEscondidos: z.boolean().optional(),
      isOutroAcabamento: z.boolean().optional(),
      outroAcabamento: z.string().optional().nullable(),
      // Uso do tecido
      isPorAltura: z.boolean().optional(),
      isPorMetrosCorridos: z.boolean().optional(),
      isPostico: z.boolean().optional(),
      isAbertoAoMeio: z.boolean().optional(),
      isEncaparCos: z.boolean().optional(),
      // Observações
      observations: z.string().optional().nullable(),
      // Suportes
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
      // Materiais e instalação
      materials: z.any().optional().nullable(),
      installationStatus: z.string().optional().nullable(),
      seamstressName: z.string().optional().nullable(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      logger.warn('Validation error:', parsed.error.message)
      return apiError(400, 'Entrada inválida', { message: parsed.error.message })
    }
    const { 
      title, description, value, priority, dueDate,
      clientName, sellerName, width, height,
      isReto, isSemiReto, isComPregas, isViraPau, isIlhos, isIlhosEscondidos, 
      isOutroAcabamento, outroAcabamento,
      isPorAltura, isPorMetrosCorridos, isPostico, isAbertoAoMeio, isEncaparCos,
      observations,
      isTrilho, isTrilhoCurvo, isVaraoVazado, isVaraGrossa, isVaraMedia,
      isCromado, isAcoEscovado, isPreto, isBranco, isBege, isTabaco,
      materials, installationStatus, seamstressName
    } = parsed.data

  logger.debug('Recebido para criar pedido:', body)

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
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
  // Validar existência do usuário para evitar erro de FK (P2003)
  const creator = await withTimeout(prisma.user.findUnique({ where: { id: createdById }, select: { id: true } }), 8000)
  if (!creator) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 })
  }

    let order: any
    try {
      order = await withTimeout(prisma.order.create({
        data: {
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          value: finalValue,
          priority: safePriority as any,
          status: 'PENDING' as any,
          createdById: createdById,
          dueDate: finalDueDate,
          // Novos campos
          clientName: clientName || null,
          sellerName: sellerName || null,
          width: width || null,
          height: height || null,
          isReto: isReto || false,
          isSemiReto: isSemiReto || false,
          isComPregas: isComPregas || false,
          isViraPau: isViraPau || false,
          isIlhos: isIlhos || false,
          isIlhosEscondidos: isIlhosEscondidos || false,
          isOutroAcabamento: isOutroAcabamento || false,
          outroAcabamento: outroAcabamento || null,
          isPorAltura: isPorAltura || false,
          isPorMetrosCorridos: isPorMetrosCorridos || false,
          isPostico: isPostico || false,
          isAbertoAoMeio: isAbertoAoMeio || false,
          isEncaparCos: isEncaparCos || false,
          observations: observations || null,
          isTrilho: isTrilho || false,
          isTrilhoCurvo: isTrilhoCurvo || false,
          isVaraoVazado: isVaraoVazado || false,
          isVaraGrossa: isVaraGrossa || false,
          isVaraMedia: isVaraMedia || false,
          isCromado: isCromado || false,
          isAcoEscovado: isAcoEscovado || false,
          isPreto: isPreto || false,
          isBranco: isBranco || false,
          isBege: isBege || false,
          isTabaco: isTabaco || false,
          materials: materials || null,
          installationStatus: installationStatus || null,
          seamstressName: seamstressName || null,
        },
      }), 8000)
    } catch (err: any) {
      // Fallback para incompatibilidade de tipos (P2032) entre enum/text no banco
      if ((err?.code || '') === 'P2032') {
        logger.warn('Prisma P2032 ao criar pedido; usando INSERT raw fallback')
        const rows = await withTimeout(prisma.$queryRaw<any[]>`
          INSERT INTO "orders" (
            "title","description","value","status","priority","created_by_id","due_date"
          ) VALUES (
            ${String(title).trim()},
            ${String(description).trim()},
            ${finalValue},
            ${'PENDING'},
            ${safePriority},
            ${createdById},
            ${finalDueDate as any}
          )
          RETURNING
            id,
            title,
            description,
            status::text AS "status",
            priority::text AS "priority",
            value,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `, 8000)
        order = rows?.[0]
      } else {
        throw err
      }
    }
    // Auditoria
    await auditLog({
      userId: createdById,
      action: 'ORDER_CREATE',
      entity: 'Order',
      entityId: order.id,
      to: { title: order.title, priority: order.priority, status: order.status, value: order.value },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    logger.error('Erro detalhado ao criar pedido:', error)
    const msg = String(error?.message || '').toLowerCase()
    if (msg.includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao criar pedido. Tente novamente.' })
    }
    // Mapear erros comuns do Prisma para respostas mais claras
    const code = (error?.code || '').toString()
    if (code === 'P2003') {
      return apiError(400, 'Entrada inválida', { message: 'Usuário inválido para criar o pedido.' })
    }
    if (code === 'P2025') {
      return apiError(404, 'Recurso não encontrado', { message: 'Registro relacionado não encontrado.' })
    }
    return apiError(500, 'Erro interno do servidor ao processar o pedido.', { message: error?.message })
  }
}
