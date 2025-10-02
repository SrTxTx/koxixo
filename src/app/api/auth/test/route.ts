import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🧪 Endpoint de teste de autenticação chamado')
    
    const targetPassword = 'It250107@'
    const testHash = '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.'
    
    // Teste de hash
    const isValid = await bcrypt.compare(targetPassword, testHash)
    
    const testResult = {
      timestamp: new Date().toISOString(),
      bcryptTest: {
        password: targetPassword,
        hash: testHash,
        isValid: isValid,
        hashLength: testHash.length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '***configured***' : '***not set***',
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? '***configured***' : '***not set***',
        nextAuthUrl: process.env.NEXTAUTH_URL
      }
    }
    
    console.log('📊 Resultado do teste:', testResult)
    
    return NextResponse.json(testResult)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    console.log('🔑 Teste de login manual:', { email, password: '***' })
    
    // Simular lógica de autenticação
    const users = [
      { email: 'admin@koxixo.com', hash: '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.', role: 'ADMIN' },
      { email: 'vendedor@koxixo.com', hash: '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.', role: 'VENDEDOR' },
      { email: 'orcamento@koxixo.com', hash: '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.', role: 'ORCAMENTO' },
      { email: 'producao@koxixo.com', hash: '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.', role: 'PRODUCAO' }
    ]
    
    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    
    const isValid = await bcrypt.compare(password, user.hash)
    console.log('🔐 Senha válida?', isValid)
    
    return NextResponse.json({
      success: isValid,
      user: isValid ? { email: user.email, role: user.role } : null,
      debug: {
        hashLength: user.hash.length,
        inputPassword: password,
        hashPreview: user.hash.substring(0, 20) + '...'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de login:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}