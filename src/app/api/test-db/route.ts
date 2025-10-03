import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔧 Testando conexão Prisma...')
    
    // Teste básico de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexão básica funcionando:', result)
    
    // Teste de busca de usuário que estava falhando
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log('✅ Busca de usuário funcionando')
    
    // Teste específico que estava falhando
    if (users.length > 0) {
      const user = await prisma.user.findUnique({
        where: {
          email: users[0].email
        }
      })
      console.log('✅ FindUnique funcionando')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conexão Prisma funcionando corretamente',
      tests: {
        basicConnection: true,
        findMany: true,
        findUnique: users.length > 0
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: {
        isPreparedStatementError: error.code === '42P05',
        isConnectionError: error.code?.startsWith('P'),
        suggestion: error.code === '42P05' 
          ? 'Adicionar prepared_statements=false na URL do banco'
          : 'Verificar configurações de conexão'
      }
    }, { status: 500 })
  }
}