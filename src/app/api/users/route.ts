import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { executeWithRetry } from '@/lib/db-config'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const users = await executeWithRetry(async () => {
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { name: 'asc' }
      })
    })

    return NextResponse.json(users)
  } catch (error) {
    logger.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { name, email, role, password } = await request.json()

    // Validações
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (!['ADMIN', 'VENDEDOR', 'ORCAMENTO', 'PRODUCAO'].includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await executeWithRetry(async () => {
      return await prisma.user.findUnique({
        where: { email }
      })
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário
    const user = await executeWithRetry(async () => {
      return await prisma.user.create({
        data: {
          name,
          email,
          role,
          password: hashedPassword
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    logger.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}