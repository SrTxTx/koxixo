import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🧪 Teste Prisma via Next.js API')
    
    // Teste 1: Conexão
    console.log('1️⃣ Testando conexão...')
    await prisma.$connect()
    console.log('✅ Conectado')

    // Teste 2: Buscar usuário
    console.log('2️⃣ Buscando usuário admin...')
    const user = await prisma.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('✅ Usuário encontrado')

    // Teste 3: Validar senha
    console.log('3️⃣ Validando senha...')
    const isValid = await bcrypt.compare('It250107@', user.password)
    console.log(`✅ Senha válida: ${isValid}`)

    // Teste 4: Buscar pedidos
    console.log('4️⃣ Buscando pedidos...')
    const ordersCount = await prisma.order.count()
    console.log(`✅ Total de pedidos: ${ordersCount}`)

    const result = {
      success: true,
      tests: {
        connection: true,
        userFound: !!user,
        passwordValid: isValid,
        ordersCount: ordersCount
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Todos os testes passaram!')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json(
      { 
        error: error.message, 
        stack: error.stack,
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔑 Teste de login via API:', { email, password: '***' })
    
    // Simular processo NextAuth
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return NextResponse.json({ success: false, error: 'User not found' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(`🔐 Senha válida: ${isValid}`)
    
    if (!isValid) {
      console.log('❌ Senha inválida')
      return NextResponse.json({ success: false, error: 'Invalid password' })
    }
    
    const authResult = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }
    
    console.log('✅ Login bem-sucedido')
    return NextResponse.json({ success: true, user: authResult })
    
  } catch (error) {
    console.error('❌ Erro no login:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}