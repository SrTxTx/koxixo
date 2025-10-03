// Teste das restrições de vendedor
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testVendedorRestrictions() {
  console.log('🧪 Testando restrições de vendedor...\n');

  try {
    // 1. Login como vendedor
    console.log('1️⃣ Fazendo login como vendedor...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'vendedor@koxixo.com',
        password: '123456',
        csrf: 'test'
      })
    });

    console.log(`Status do login: ${loginResponse.status}`);
    
    // 2. Buscar pedidos para ver quais existem
    console.log('\n2️⃣ Buscando pedidos existentes...');
    const pedidosResponse = await fetch(`${BASE_URL}/api/pedidos`);
    const pedidos = await pedidosResponse.json();
    
    console.log(`Encontrados ${pedidos.length} pedidos:`);
    pedidos.forEach((pedido, index) => {
      console.log(`   ${index + 1}. ID: ${pedido.id} - Criado por: ${pedido.createdBy?.name || 'N/A'} (${pedido.createdBy?.email || 'N/A'})`);
    });

    // 3. Tentar editar um pedido que não seja do vendedor (se existir)
    const pedidoOutroUsuario = pedidos.find(p => p.createdBy?.email !== 'vendedor@koxixo.com');
    
    if (pedidoOutroUsuario) {
      console.log(`\n3️⃣ Tentando editar pedido de outro usuário (ID: ${pedidoOutroUsuario.id})...`);
      
      const editResponse = await fetch(`${BASE_URL}/api/pedidos/${pedidoOutroUsuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Tentativa de edição não autorizada',
          description: 'Teste de restrição',
          value: 100,
          priority: 'HIGH'
        })
      });

      const editResult = await editResponse.json();
      console.log(`Status: ${editResponse.status}`);
      console.log(`Resposta:`, editResult);
      
      if (editResponse.status === 403) {
        console.log('✅ SUCESSO: Vendedor foi impedido de editar pedido de outro usuário!');
      } else {
        console.log('❌ ERRO: Vendedor conseguiu editar pedido de outro usuário!');
      }
    } else {
      console.log('\n3️⃣ Não há pedidos de outros usuários para testar a restrição.');
    }

    // 4. Tentar editar um pedido próprio do vendedor (se existir)
    const pedidoVendedor = pedidos.find(p => p.createdBy?.email === 'vendedor@koxixo.com');
    
    if (pedidoVendedor) {
      console.log(`\n4️⃣ Tentando editar pedido próprio (ID: ${pedidoVendedor.id})...`);
      
      const editResponse = await fetch(`${BASE_URL}/api/pedidos/${pedidoVendedor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${pedidoVendedor.title} - EDITADO`,
          description: pedidoVendedor.description,
          value: pedidoVendedor.value,
          priority: pedidoVendedor.priority
        })
      });

      const editResult = await editResponse.json();
      console.log(`Status: ${editResponse.status}`);
      
      if (editResponse.status === 200) {
        console.log('✅ SUCESSO: Vendedor conseguiu editar seu próprio pedido!');
        console.log(`Editado por: ${editResult.lastEditedBy?.name || 'N/A'}`);
        console.log(`Data da edição: ${editResult.lastEditedAt || 'N/A'}`);
      } else {
        console.log('❌ ERRO: Vendedor não conseguiu editar seu próprio pedido!');
        console.log('Resposta:', editResult);
      }
    } else {
      console.log('\n4️⃣ Não há pedidos do vendedor para testar a edição própria.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }

  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
testVendedorRestrictions();