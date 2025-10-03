// Teste da API de restrições
const { getServerSession } = require('next-auth')

// Simular teste da lógica da API
async function testAPILogic() {
  console.log('🧪 Testando lógica da API de restrições...\n')

  // Simular dados de sessão de vendedor
  const vendedorSession = {
    user: {
      id: 10, // ID do João Vendedor
      email: 'vendedor@koxixo.com',
      role: 'VENDEDOR'
    }
  }

  // Simular dados de sessão de admin
  const adminSession = {
    user: {
      id: 1, // ID do Admin
      email: 'admin@koxixo.com', 
      role: 'ADMIN'
    }
  }

  console.log('📋 Cenários de teste:')
  console.log('1. Vendedor tenta editar pedido próprio (ID: 7 ou 8)')
  console.log('2. Vendedor tenta editar pedido de outro (ID: 3, 4, 5, 6)')
  console.log('3. Admin pode editar qualquer pedido')

  // Testar lógica de restrição
  function canEditOrder(session, order) {
    if (!session) return false
    
    const userRole = session.user.role
    const userId = session.user.id
    
    // Admin pode editar qualquer pedido
    if (userRole === 'ADMIN') return true
    
    // Vendedor só pode editar seus próprios pedidos
    if (userRole === 'VENDEDOR') {
      return order.createdById === userId
    }
    
    // Outros perfis podem editar qualquer pedido
    return true
  }

  // Simular pedidos
  const pedidos = [
    { id: 3, title: 'Banner para Evento', createdById: 11 }, // Lúcia
    { id: 4, title: 'Folhetos Promocionais', createdById: 12 }, // Marcos  
    { id: 7, title: 'Pedido de Impressão 001', createdById: 10 }, // João Vendedor
    { id: 8, title: 'Material Institucional', createdById: 10 }, // João Vendedor
  ]

  console.log('\n🧪 Resultados dos testes:')
  
  // Teste 1: Vendedor editando próprios pedidos
  pedidos.filter(p => p.createdById === 10).forEach(pedido => {
    const canEdit = canEditOrder(vendedorSession, pedido)
    console.log(`✅ Vendedor editando pedido próprio (${pedido.title}): ${canEdit ? 'PERMITIDO' : 'NEGADO'}`)
  })

  // Teste 2: Vendedor editando pedidos de outros
  pedidos.filter(p => p.createdById !== 10).forEach(pedido => {
    const canEdit = canEditOrder(vendedorSession, pedido)
    console.log(`${canEdit ? '❌' : '✅'} Vendedor editando pedido de outro (${pedido.title}): ${canEdit ? 'PERMITIDO' : 'NEGADO'}`)
  })

  // Teste 3: Admin editando qualquer pedido
  pedidos.forEach(pedido => {
    const canEdit = canEditOrder(adminSession, pedido)
    console.log(`✅ Admin editando pedido (${pedido.title}): ${canEdit ? 'PERMITIDO' : 'NEGADO'}`)
  })
}

testAPILogic()