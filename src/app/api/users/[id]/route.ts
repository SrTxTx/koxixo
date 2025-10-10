import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { executeWithRetry } from '@/lib/db-config'
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
    const existingUser = await executeWithRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: userId }
      })
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se email já está em uso por outro usuário
    const emailInUse = await executeWithRetry(async () => {
      return await prisma.user.findFirst({
        where: { 
          email,
          id: { not: userId }
        }
      })
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
    logger.error('Erro ao atualizar usuário:', error)
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

    // Verificar se usuário tem pedidos criados
    const userOrders = await prisma.order.findMany({
      where: { createdById: userId }
    })

    // Se o usuário tem pedidos, transferir a propriedade para o admin atual
    if (userOrders.length > 0) {
    logger.info(`Transferindo ${userOrders.length} pedidos do usuário ${existingUser.name} para o admin ${session.user.name}`)
      
      // Atualizar pedidos criados pelo usuário
      await prisma.order.updateMany({
        where: { createdById: userId },
        data: { createdById: parseInt(session.user.id) }
      })
    }

    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId }
    })

    const message = userOrders.length > 0 
      ? `Usuário excluído com sucesso. ${userOrders.length} pedidos foram transferidos para sua conta.`
      : 'Usuário excluído com sucesso'

    return NextResponse.json({ message })
  } catch (error) {
    logger.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}