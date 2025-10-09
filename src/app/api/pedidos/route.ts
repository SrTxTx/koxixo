import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Listar todos os pedidos
export async function GET() {
  console.log('🔍 API /pedidos - Iniciando verificação de sessão...')
  
  const session = await getServerSession(authOptions)
  console.log('📋 Sessão recebida:', session ? {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role
  } : 'Nenhuma sessão')
  
  if (!session) {
    console.log('❌ Acesso negado - nenhuma sessão encontrada')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
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
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', message: error?.message }, { status: 500 })
  }
}

// POST: Criar um novo pedido
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { title, description, value, priority, dueDate } = body

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

    const order = await prisma.order.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        value: finalValue,
        priority: safePriority,
        status: 'PENDING',
        createdById: createdById,
        dueDate: finalDueDate,
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Erro detalhado ao criar pedido:', error) // Log de erro detalhado
    return NextResponse.json({ error: 'Erro interno do servidor ao processar o pedido.', message: error?.message }, { status: 500 })
  }
}
