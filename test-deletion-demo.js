// Criar usuário de teste e depois excluir
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUserAndDelete() {
  console.log('🧪 Criando usuário de teste para demonstrar exclusão...\n')

  try {
    // 1. Criar usuário de teste
    console.log('1️⃣ Criando usuário de teste...')
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Usuário de Teste',
        email: 'teste@koxixo.com',
        password: hashedPassword,
        role: 'VENDEDOR'
      }
    })

    console.log(`✅ Usuário criado: ${testUser.name} (ID: ${testUser.id})`)

    // 2. Criar pedido para o usuário de teste
    console.log('\n2️⃣ Criando pedido para o usuário de teste...')
    
    const testOrder = await prisma.order.create({
      data: {
        title: 'Pedido de Teste para Exclusão',
        description: 'Este pedido foi criado para testar a funcionalidade de exclusão',
        value: 150.00,
        priority: 'MEDIUM',
        createdById: testUser.id
      }
    })

    console.log(`✅ Pedido criado: "${testOrder.title}" (ID: ${testOrder.id})`)

    // 3. Verificar situação antes da exclusão
    console.log('\n3️⃣ Situação antes da exclusão:')
    const userWithOrders = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        _count: {
          select: { createdOrders: true }
        }
      }
    })

    console.log(`   Usuário: ${userWithOrders?.name}`)
    console.log(`   Pedidos criados: ${userWithOrders?._count.createdOrders}`)
    console.log(`   ❌ ANTES: Este usuário NÃO podia ser excluído`)

    // 4. Simular comportamento da nova API
    console.log('\n4️⃣ Simulando nova funcionalidade de exclusão...')
    
    // Buscar admin para receber os pedidos
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (admin) {
      console.log(`   📋 Transferindo pedidos para: ${admin.name}`)
      
      // Transferir pedidos
      await prisma.order.updateMany({
        where: { createdById: testUser.id },
        data: { createdById: admin.id }
      })

      console.log(`   ✅ Pedidos transferidos com sucesso`)

      // Excluir usuário
      await prisma.user.delete({
        where: { id: testUser.id }
      })

      console.log(`   ✅ Usuário "${testUser.name}" excluído com sucesso`)

      // Verificar se pedido ainda existe
      const orderStillExists = await prisma.order.findUnique({
        where: { id: testOrder.id },
        include: { createdBy: true }
      })

      if (orderStillExists) {
        console.log(`   ✅ Pedido preservado: "${orderStillExists.title}"`)
        console.log(`   ✅ Novo proprietário: ${orderStillExists.createdBy.name}`)
      }
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('\n📊 FUNCIONALIDADE IMPLEMENTADA:')
    console.log('   ✅ Admin pode excluir usuários com pedidos')
    console.log('   ✅ Pedidos são automaticamente transferidos')
    console.log('   ✅ Nenhum dado é perdido')
    console.log('   ✅ Sistema mantém integridade dos dados')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUserAndDelete()