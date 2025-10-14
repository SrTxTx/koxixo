import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
// Removed pdfkit due to font file dependency in serverless bundles
import { z } from 'zod'
import { apiError, withTimeout } from '@/lib/api'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function parseDate(value?: string | null) {
  if (!value) return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d
}

function csvEscape(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escape quotes and wrap in quotes if contains delimiter/newline/quote
  const needsQuote = /[",\n\r;]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuote ? `"${escaped}"` : escaped
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) {
    return apiError(401, 'Não autorizado')
  }

  try {
    const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const startDate = parseDate(searchParams.get('startDate'))
    const endDate = parseDate(searchParams.get('endDate'))
    const range = searchParams.get('range') || undefined
  const format = (searchParams.get('format') || 'csv').toLowerCase()
  const fieldsParam = searchParams.get('fields') || ''
    const allowedFields = ['id','title','description','status','priority','value','createdAt','dueDate','createdBy','lastEditedBy','approvedBy','rejectedBy','rejectionReason','completedAt','deliveredAt'] as const
    const selectedFieldsRaw = (fieldsParam ? fieldsParam.split(',') : ['id','title','status','priority','value','createdAt','createdBy']).filter(Boolean)
    const selectedFields = selectedFieldsRaw.filter(f => (allowedFields as readonly string[]).includes(f))
    if (selectedFields.length === 0) {
      return apiError(400, 'Nenhum campo válido selecionado')
    }
    if (!['csv','pdf'].includes(format)) {
      return apiError(400, 'Formato inválido')
    }
    const validStatus = ['PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','DELIVERED','CANCELLED'] as const
    const validPriority = ['LOW','MEDIUM','HIGH'] as const
  if (status && !validStatus.includes(status as any)) return apiError(400, 'Status inválido')
  if (priority && !validPriority.includes(priority as any)) return apiError(400, 'Prioridade inválida')

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
      const users = await withTimeout(prisma.user.findMany({
        where: { name: { contains: createdBy, mode: 'insensitive' } },
        select: { id: true },
      }), 8000)
      const ids = users.map((u) => u.id)
      where.createdById = ids.length ? { in: ids } : -1
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    let orders: any[] = []
    try {
      orders = await withTimeout(prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
          lastEditedBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          rejectedBy: { select: { name: true } },
        },
      }), 8000)
    } catch (err: any) {
      if ((err?.code || '') === 'P2032' || String(err?.message || '').includes('converting field')) {
        logger.warn('Export: P2032 detected, using raw SQL fallback')
        orders = await withTimeout(prisma.$queryRaw<any[]>`
          SELECT 
            o.id,
            o.title,
            o.description,
            o.status::text AS "status",
            o.priority::text AS "priority",
            o.value,
            o.created_at AS "createdAt",
            o.due_date AS "dueDate",
            o.completed_at AS "completedAt",
            o.delivered_at AS "deliveredAt",
            o.rejection_reason AS "rejectionReason",
            cb.name AS "createdByName",
            leb.name AS "lastEditedByName",
            ab.name AS "approvedByName",
            rb.name AS "rejectedByName"
          FROM "orders" o
          LEFT JOIN "users" cb ON o.created_by_id = cb.id
          LEFT JOIN "users" leb ON o.last_edited_by_id = leb.id
          LEFT JOIN "users" ab ON o.approved_by_id = ab.id
          LEFT JOIN "users" rb ON o.rejected_by_id = rb.id
          ORDER BY o.created_at DESC
          LIMIT 500
        `, 8000)
        // Normalize to match Prisma shape
        orders = orders.map((o: any) => ({
          ...o,
          createdBy: o.createdByName ? { name: o.createdByName } : null,
          lastEditedBy: o.lastEditedByName ? { name: o.lastEditedByName } : null,
          approvedBy: o.approvedByName ? { name: o.approvedByName } : null,
          rejectedBy: o.rejectedByName ? { name: o.rejectedByName } : null,
        }))
      } else {
        throw err
      }
    }
    
    const columns: { key: string; label: string; getter: (o: any) => any }[] = [
      { key: 'id', label: 'ID', getter: (o) => o.id },
      { key: 'title', label: 'Título', getter: (o) => o.title },
      { key: 'description', label: 'Descrição', getter: (o) => o.description ?? '' },
      { key: 'status', label: 'Status', getter: (o) => o.status },
      { key: 'priority', label: 'Prioridade', getter: (o) => o.priority },
      { key: 'value', label: 'Valor', getter: (o) => (o.value ?? '') },
      { key: 'createdAt', label: 'Data de Criação', getter: (o) => o.createdAt?.toISOString?.() || o.createdAt },
      { key: 'dueDate', label: 'Prazo (DueDate)', getter: (o) => (o.dueDate ? (o.dueDate.toISOString?.() || o.dueDate) : '') },
      { key: 'createdBy', label: 'Criado por', getter: (o) => o.createdBy?.name ?? '' },
      { key: 'lastEditedBy', label: 'Editado por', getter: (o) => o.lastEditedBy?.name ?? '' },
      { key: 'approvedBy', label: 'Aprovado por', getter: (o) => o.approvedBy?.name ?? '' },
      { key: 'rejectedBy', label: 'Rejeitado por', getter: (o) => o.rejectedBy?.name ?? '' },
      { key: 'rejectionReason', label: 'Motivo rejeição', getter: (o) => o.rejectionReason ?? '' },
      { key: 'completedAt', label: 'Concluído em', getter: (o) => o.completedAt ? (o.completedAt.toISOString?.() || o.completedAt) : '' },
      { key: 'deliveredAt', label: 'Entregue em', getter: (o) => o.deliveredAt ? (o.deliveredAt.toISOString?.() || o.deliveredAt) : '' },
    ]

    const activeCols = columns.filter(c => selectedFields.includes(c.key))

    if (format === 'pdf') {
      // Generate a minimal PDF without external font files
      const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      const lines: string[] = []
      lines.push('Relatório de Pedidos')
      // Header row
      lines.push(activeCols.map(c => c.label).join(' | '))
      // First ~50 rows to avoid huge PDFs
      const maxRows = Math.min(50, orders.length)
      for (let i = 0; i < maxRows; i++) {
        const o = orders[i]
        const row = activeCols.map(c => String(c.getter(o) ?? '')).join(' | ')
        lines.push(row)
      }

      // Build simple one-page PDF
      const objects: string[] = []
      const offsets: number[] = []
      const pushObj = (s: string) => { offsets.push(size); objects.push(s + '\n'); size += Buffer.byteLength(s + '\n', 'utf8') }
      let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
      let size = Buffer.byteLength(pdf, 'utf8')

      // 1: Catalog
      pushObj('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
      // 2: Pages
      pushObj('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj')
      // 5: Font
      pushObj('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj')
      // 3: Page (resources reference font 5 0 R)
      pushObj('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj')
      // 4: Contents
      const contentParts: string[] = []
      contentParts.push('BT')
      contentParts.push('/F1 12 Tf')
      contentParts.push('72 760 Td')
      contentParts.push(`(${escape(lines[0] || '')}) Tj`)
      let y = 740
      for (let i = 1; i < lines.length; i++) {
        y -= 16
        if (y < 60) break
        contentParts.push(`72 ${y} Td`)
        contentParts.push(`(${escape(lines[i])}) Tj`)
      }
      contentParts.push('ET')
      const contentStream = contentParts.join('\n')
      const content = `4 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}\nendstream endobj`
      pushObj(content)
      // 6: Info (optional)
      pushObj('6 0 obj << /Producer (Koxixo) >> endobj')

      // Build xref
      const xrefStart = size
      let xref = 'xref\n0 ' + (objects.length + 1) + '\n'
      xref += '0000000000 65535 f \n'
      for (const off of offsets) {
        xref += (off.toString().padStart(10, '0')) + ' 00000 n \n'
      }
      const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

      // Concatenate full PDF
      const body = objects.join('')
      const full = pdf + body + xref + trailer
      const buffer = Buffer.from(full, 'utf8')
      const filename = `relatorio-pedidos-${new Date().toISOString().slice(0,10)}.pdf`
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // CSV streaming
    const maxRows = Math.max(1, Math.min(5000, parseInt((searchParams.get('max') || '5000'), 10)))
    const filename = `relatorio-pedidos-${new Date().toISOString().slice(0,10)}.csv`

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const encoder = new TextEncoder()
        // BOM + header
        const header = activeCols.map(c => c.label).map(csvEscape).join(';') + '\n'
        controller.enqueue(encoder.encode('\uFEFF' + header))

        // Paginate to avoid loading all rows
        let lastId: number | undefined = undefined
        let sent = 0
        const pageSize = 500

        try {
          while (sent < maxRows) {
            const batch = await prisma.order.findMany({
              where,
              orderBy: { id: 'asc' },
              take: Math.min(pageSize, maxRows - sent),
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              include: {
                createdBy: { select: { name: true } },
                lastEditedBy: { select: { name: true } },
                approvedBy: { select: { name: true } },
                rejectedBy: { select: { name: true } },
              },
            })
            if (batch.length === 0) break
            for (const o of batch) {
              const row = activeCols.map(c => csvEscape(c.getter(o))).join(';') + '\n'
              controller.enqueue(encoder.encode(row))
              sent++
              if (sent >= maxRows) break
            }
            lastId = batch[batch.length - 1].id
          }
        } catch (err) {
          // Emit nothing further; close stream
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Row-Limit': String(maxRows),
      },
    })
  } catch (error: any) {
    logger.error('Erro ao exportar CSV/PDF:', error)
    if (String(error?.message || '').toLowerCase().includes('tempo limite')) {
      return apiError(504, 'Serviço indisponível', { message: 'Tempo limite ao exportar relatório' })
    }
    return apiError(500, 'Erro interno do servidor', { message: error?.message })
  }
}
