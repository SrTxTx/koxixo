const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function testCompleteSystem() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Teste Completo do Sistema\n')
    
    // 1. Teste de Conexão
    console.log('1️⃣ Testando conexão Prisma...')
    await prisma.$connect()
    console.log('✅ Prisma conectado com sucesso!')

    // 2. Teste de Usuário
    console.log('\n2️⃣ Testando busca de usuário...')
    const user = await prisma.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado!')
      return
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })

    // 3. Teste de Senha
    console.log('\n3️⃣ Testando validação de senha...')
    const isValid = await bcrypt.compare('It250107@', user.password)
    console.log(`✅ Senha válida: ${isValid}`)

    // 4. Teste de Criação de Pedido
    console.log('\n4️⃣ Testando criação de pedido...')
    const newOrder = await prisma.order.create({
      data: {
        title: 'Teste de Pedido',
        description: 'Pedido criado para teste do sistema',
        value: 100.50,
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
        createdById: user.id
      }
    })
    
    console.log('✅ Pedido criado:', {
      id: newOrder.id,
      title: newOrder.title,
      status: newOrder.status,
      dueDate: newOrder.dueDate
    })

    // 5. Teste de Busca de Pedidos
    console.log('\n5️⃣ Testando busca de pedidos...')
    const orders = await prisma.order.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ Total de pedidos encontrados: ${orders.length}`)
    orders.forEach(order => {
      console.log(`   - ${order.title} (${order.status}) - Criado por: ${order.createdBy.name}`)
    })

    // 6. Teste de Autenticação Completa (simulando NextAuth)
    console.log('\n6️⃣ Simulando processo completo de autenticação...')
    
    const credentials = { email: 'admin@koxixo.com', password: 'It250107@' }
    console.log('Credenciais recebidas:', { email: credentials.email, password: '***' })
    
    const authUser = await prisma.user.findUnique({
      where: { email: credentials.email }
    })
    
    if (!authUser) {
      console.log('❌ Autenticação falhou: usuário não encontrado')
      return
    }
    
    const authValid = await bcrypt.compare(credentials.password, authUser.password)
    
    if (!authValid) {
      console.log('❌ Autenticação falhou: senha incorreta')
      return
    }
    
    const authResult = {
      id: authUser.id.toString(),
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
    }
    
    console.log('✅ Autenticação bem-sucedida!')
    console.log('   Dados retornados:', authResult)

    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema 100% funcional!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Prisma desconectado')
  }
}

testCompleteSystem()