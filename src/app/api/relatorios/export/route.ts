import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'

export const dynamic = 'force-dynamic'

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
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
    const selectedFields = (fieldsParam ? fieldsParam.split(',') : [
      'id','title','status','priority','value','createdAt','createdBy'
    ]).filter(Boolean)

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
      const users = await prisma.user.findMany({
        where: { name: { contains: createdBy, mode: 'insensitive' } },
        select: { id: true },
      })
      const ids = users.map((u) => u.id)
      where.createdById = ids.length ? { in: ids } : -1
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        rejectedBy: { select: { name: true } },
      },
    })
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
      // Generate PDF with a simple branded header and a table
  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const chunks: any[] = []
  doc.on('data', (chunk: any) => chunks.push(chunk))
  doc.on('end', () => {})

      // Header with simple Koxixo logo
      const startX = 40, startY = 40
      doc.rect(startX, startY, 24, 24).fill('#dc2626') // red square
      doc.fillColor('#ffffff').fontSize(16).text('K', startX + 6, startY + 4)
      doc.fillColor('#111827').fontSize(18).text('Koxixo - Relatório de Pedidos', startX + 34, startY + 2)
      doc.moveDown()
      doc.fillColor('#374151').fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`)

      // Table
      const tableTop = 90
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
      const colWidth = pageWidth / activeCols.length
      let y = tableTop

      doc.moveTo(40, y - 6).lineTo(40 + pageWidth, y - 6).stroke('#e5e7eb')
      // Header row
      doc.fontSize(10).fillColor('#111827')
      activeCols.forEach((c, i) => {
        doc.text(c.label, 40 + i * colWidth + 2, y, { width: colWidth - 4, continued: false })
      })
      y += 18
      doc.moveTo(40, y - 6).lineTo(40 + pageWidth, y - 6).stroke('#e5e7eb')

      doc.fontSize(9).fillColor('#1f2937')
      const lineHeight = 14
      for (const o of orders) {
        // Calculate row height based on the tallest wrapped cell
        let maxHeight = lineHeight
        activeCols.forEach((c) => {
          const text = String(c.getter(o) ?? '')
          const options = { width: colWidth - 4 }
          const h = doc.heightOfString(text, options)
          if (h + 6 > maxHeight) maxHeight = h + 6
        })
  if (y + maxHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage()
          y = tableTop
          // redraw header on new page
          doc.fontSize(10).fillColor('#111827')
          activeCols.forEach((c, i) => {
            doc.text(c.label, 40 + i * colWidth + 2, y, { width: colWidth - 4 })
          })
          y += 18
          doc.moveTo(40, y - 6).lineTo(40 + pageWidth, y - 6).stroke('#e5e7eb')
          doc.fontSize(9).fillColor('#1f2937')
        }
        activeCols.forEach((c, i) => {
          const text = String(c.getter(o) ?? '')
          doc.text(text, 40 + i * colWidth + 2, y, { width: colWidth - 4 })
        })
        y += maxHeight
        doc.moveTo(40, y - 6).lineTo(40 + pageWidth, y - 6).stroke('#f3f4f6')
      }

      doc.end()
  const buffer = Buffer.concat(chunks)
      const filename = `relatorio-pedidos-${new Date().toISOString().slice(0,10)}.pdf`
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // CSV default
    const header = activeCols.map(c => c.label)
    const rows = orders.map((o) => activeCols.map((c) => c.getter(o)))
    let csv = '\uFEFF' + header.map(csvEscape).join(';') + '\n'
    for (const r of rows) {
      csv += r.map(csvEscape).join(';') + '\n'
    }
    const filename = `relatorio-pedidos-${new Date().toISOString().slice(0,10)}.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Erro ao exportar CSV/PDF:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', message: error?.message }, { status: 500 })
  }
}
