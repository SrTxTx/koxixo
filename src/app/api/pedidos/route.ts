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
      include: {
        createdBy: true,
        rejectedBy: true
      },
    })
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
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

    if (!title || !description) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 })
    }

    // Validação robusta dos campos opcionais
    const finalValue = (value !== null && value !== '' && !isNaN(parseFloat(value as string))) ? parseFloat(value as string) : null
    const finalDueDate = (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') ? new Date(dueDate) : null

    const createdById = parseInt(session.user.id, 10)
    if (isNaN(createdById)) {
        return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 })
    }

    const order = await prisma.order.create({
      data: {
        title,
        description,
        value: finalValue,
        priority: priority || 'NORMAL',
        status: 'PENDING',
        createdById: createdById,
        dueDate: finalDueDate,
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Erro detalhado ao criar pedido:', error) // Log de erro detalhado
    return NextResponse.json({ error: 'Erro interno do servidor ao processar o pedido.' }, { status: 500 })
  }
}
