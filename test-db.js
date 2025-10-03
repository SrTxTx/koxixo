// Script para testar a conexão Prisma e resolver problemas de prepared statements
const { prisma } = require('./src/lib/prisma')

async function testConnection() {
  try {
    console.log('🔧 Testando conexão com banco de dados...')
    
    // Teste básico de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexão básica funcionando:', result)
    
    // Teste de busca de usuário (que estava falhando)
    console.log('🔍 Testando busca de usuário...')
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log('✅ Busca de usuário funcionando:', users.length > 0 ? 'Encontrou usuários' : 'Nenhum usuário')
    
    // Teste específico que estava falhando
    if (users.length > 0) {
      const user = await prisma.user.findUnique({
        where: {
          email: users[0].email
        }
      })
      console.log('✅ FindUnique funcionando:', user ? 'Usuario encontrado' : 'Usuario não encontrado')
    }
    
    console.log('🎉 Todos os testes passaram! Problema resolvido.')
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message)
    console.error('📝 Detalhes:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Conexão encerrada')
  }
}

testConnection()