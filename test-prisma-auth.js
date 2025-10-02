const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testPrismaAuth() {
  try {
    console.log('🔌 Testando Prisma com banco Supabase...')
    
    // Teste de conexão
    console.log('📡 Testando conexão...')
    await prisma.$connect()
    console.log('✅ Prisma conectado!')

    // Buscar usuário admin
    console.log('\n🔍 Buscando usuário admin...')
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@koxixo.com'
      }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado!')
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Password hash: ${user.password}`)
    console.log(`   Created: ${user.createdAt}`)

    // Testar senha
    console.log('\n🔐 Testando senha...')
    const targetPassword = 'It250107@'
    const isValid = await bcrypt.compare(targetPassword, user.password)
    console.log(`   Senha '${targetPassword}': ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`)

    // Simular processo completo do NextAuth
    console.log('\n🎭 Simulando processo NextAuth...')
    
    console.log('1. Credenciais recebidas:', { email: 'admin@koxixo.com', password: '***' })
    
    console.log('2. Buscando usuário no banco...')
    const authUser = await prisma.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    })
    
    if (!authUser) {
      console.log('   ❌ Falha: usuário não encontrado')
      return
    }
    console.log('   ✅ Usuário encontrado')
    
    console.log('3. Comparando senha...')
    const authIsValid = await bcrypt.compare(targetPassword, authUser.password)
    console.log(`   ${authIsValid ? '✅' : '❌'} Resultado: ${authIsValid}`)
    
    if (authIsValid) {
      console.log('4. ✅ Retornando dados do usuário:')
      const authResult = {
        id: authUser.id.toString(),
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      }
      console.log('   ', authResult)
    } else {
      console.log('4. ❌ Falha na autenticação')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Prisma desconectado')
  }
}

testPrismaAuth()