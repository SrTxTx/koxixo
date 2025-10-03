const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testImplementation() {
  console.log('🧪 Testando implementação dos campos de edição...\n')

  try {
    // 1. Verificar se os campos existem no modelo
    console.log('1️⃣ Testando se os campos foram adicionados...')
    
    // Buscar um pedido existente
    const pedido = await prisma.order.findFirst({
      include: {
        createdBy: true,
        lastEditedBy: true
      }
    })

    if (pedido) {
      console.log('✅ Pedido encontrado:')
      console.log(`   ID: ${pedido.id}`)
      console.log(`   Título: ${pedido.title}`)
      console.log(`   Criado por: ${pedido.createdBy?.name || 'N/A'}`)
      console.log(`   Último editor: ${pedido.lastEditedBy?.name || 'Ninguém editou ainda'}`)
      console.log(`   Data da última edição: ${pedido.lastEditedAt || 'Nunca editado'}`)
    } else {
      console.log('❌ Nenhum pedido encontrado')
    }

    // 2. Buscar usuários para o teste
    console.log('\n2️⃣ Buscando usuários...')
    const vendedor = await prisma.user.findUnique({
      where: { email: 'vendedor@koxixo.com' }
    })
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    })

    if (vendedor) {
      console.log(`✅ Vendedor encontrado: ${vendedor.name} (ID: ${vendedor.id})`)
    }
    
    if (admin) {
      console.log(`✅ Admin encontrado: ${admin.name} (ID: ${admin.id})`)
    }

    // 3. Testar atualização com registro de edição
    if (pedido && admin) {
      console.log('\n3️⃣ Testando atualização com registro de edição...')
      
      const updatedPedido = await prisma.order.update({
        where: { id: pedido.id },
        data: {
          title: `${pedido.title} - TESTE EDITADO`,
          lastEditedById: admin.id,
          lastEditedAt: new Date()
        },
        include: {
          createdBy: true,
          lastEditedBy: true
        }
      })

      console.log('✅ Pedido atualizado com sucesso:')
      console.log(`   Novo título: ${updatedPedido.title}`)
      console.log(`   Editado por: ${updatedPedido.lastEditedBy?.name}`)
      console.log(`   Data da edição: ${updatedPedido.lastEditedAt}`)
    }

    // 4. Listar pedidos por usuário (para teste de restrição)
    console.log('\n4️⃣ Listando pedidos por usuário...')
    
    if (vendedor) {
      const pedidosVendedor = await prisma.order.findMany({
        where: { createdById: vendedor.id },
        include: {
          createdBy: true,
          lastEditedBy: true
        }
      })

      console.log(`📋 Pedidos do vendedor (${pedidosVendedor.length}):`)
      pedidosVendedor.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.title} - Criado: ${p.createdAt.toLocaleDateString()}`)
      })

      // Contar pedidos de outros usuários
      const pedidosOutros = await prisma.order.findMany({
        where: { 
          NOT: { createdById: vendedor.id }
        },
        include: {
          createdBy: true
        }
      })

      console.log(`📋 Pedidos de outros usuários (${pedidosOutros.length}):`)
      pedidosOutros.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.title} - Criado por: ${p.createdBy?.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n🏁 Teste concluído!')
}

testImplementation()