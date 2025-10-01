import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const { name, email, role, password } = await request.json()

    // Validações
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Nome, email e cargo são obrigatórios' }, { status: 400 })
    }

    if (!['ADMIN', 'VENDEDOR', 'ORCAMENTO', 'PRODUCAO'].includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se email já está em uso por outro usuário
    const emailInUse = await prisma.user.findFirst({
      where: { 
        email,
        id: { not: userId }
      }
    })

    if (emailInUse) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      email,
      role
    }

    // Se senha foi fornecida, incluir no update
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const userId = parseInt(params.id)

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permitir excluir o próprio usuário
    if (userId === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 })
    }

    // Verificar se usuário tem pedidos
    const userOrders = await prisma.order.findFirst({
      where: { createdById: userId }
    })

    if (userOrders) {
      return NextResponse.json({ 
        error: 'Não é possível excluir usuário que possui pedidos cadastrados' 
      }, { status: 400 })
    }

    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}