// Verificar usuários e seus pedidos
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsersWithOrders() {
  console.log('🔍 Verificando usuários e seus pedidos...\n')

  try {
    // Buscar todos os usuários
    const usuarios = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            createdOrders: true,
            lastEditedOrders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log('📋 Lista de usuários e seus pedidos:')
    console.log('=' .repeat(60))

    usuarios.forEach((usuario, index) => {
      const temPedidos = usuario._count.createdOrders > 0
      const temEdicoes = usuario._count.lastEditedOrders > 0
      const podeExcluir = !temPedidos && !temEdicoes

      console.log(`${index + 1}. ${usuario.name} (${usuario.email})`)
      console.log(`   Cargo: ${usuario.role}`)
      console.log(`   Pedidos criados: ${usuario._count.createdOrders}`)
      console.log(`   Pedidos editados: ${usuario._count.lastEditedOrders}`)
      console.log(`   ${podeExcluir ? '✅ PODE SER EXCLUÍDO' : '❌ NÃO PODE SER EXCLUÍDO'}`)
      console.log('')
    })

    // Mostrar estatísticas
    const totalUsuarios = usuarios.length
    const usuariosComPedidos = usuarios.filter(u => u._count.createdOrders > 0).length
    const usuariosComEdicoes = usuarios.filter(u => u._count.lastEditedOrders > 0).length
    const usuariosPodeExcluir = usuarios.filter(u => u._count.createdOrders === 0 && u._count.lastEditedOrders === 0).length

    console.log('📊 ESTATÍSTICAS:')
    console.log(`   Total de usuários: ${totalUsuarios}`)
    console.log(`   Usuários com pedidos criados: ${usuariosComPedidos}`)
    console.log(`   Usuários com pedidos editados: ${usuariosComEdicoes}`)
    console.log(`   Usuários que podem ser excluídos: ${usuariosPodeExcluir}`)

    // Listar pedidos detalhados
    console.log('\n📦 DETALHES DOS PEDIDOS:')
    const pedidos = await prisma.order.findMany({
      include: {
        createdBy: true,
        lastEditedBy: true
      },
      orderBy: { createdAt: 'desc' }
    })

    pedidos.forEach((pedido, index) => {
      console.log(`${index + 1}. "${pedido.title}"`)
      console.log(`   Criado por: ${pedido.createdBy?.name}`)
      console.log(`   Editado por: ${pedido.lastEditedBy?.name || 'Ninguém'}`)
      console.log(`   Status: ${pedido.status}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsersWithOrders()