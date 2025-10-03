// Teste para simular edição de pedido
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEditOrder() {
  console.log('=== TESTE DE EDIÇÃO DE PEDIDO ===\n');
  
  try {
    // 1. Buscar um pedido existente
    const existingOrder = await prisma.order.findFirst({
      where: { status: 'PENDING' },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      }
    });
    
    if (!existingOrder) {
      console.log('Nenhum pedido PENDING encontrado para teste');
      return;
    }
    
    console.log('1. Pedido antes da edição:');
    console.log(`- ID: ${existingOrder.id}`);
    console.log(`- Título: ${existingOrder.title}`);
    console.log(`- Criado por: ${existingOrder.createdBy.name}`);
    console.log(`- Editado por: ${existingOrder.lastEditedBy?.name || 'Nunca editado'}`);
    console.log(`- Data edição: ${existingOrder.lastEditedAt || 'Nunca editado'}`);
    
    // 2. Buscar usuário admin para simular edição
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.log('Usuário admin não encontrado');
      return;
    }
    
    // 3. Simular edição
    console.log('\n2. Simulando edição...');
    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        title: existingOrder.title + ' [EDITADO TESTE]',
        lastEditedById: adminUser.id,
        lastEditedAt: new Date(),
      },
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      }
    });
    
    console.log('3. Pedido após edição:');
    console.log(`- ID: ${updatedOrder.id}`);
    console.log(`- Título: ${updatedOrder.title}`);
    console.log(`- Criado por: ${updatedOrder.createdBy.name}`);
    console.log(`- Editado por: ${updatedOrder.lastEditedBy?.name || 'Nunca editado'}`);
    console.log(`- Data edição: ${updatedOrder.lastEditedAt || 'Nunca editado'}`);
    
    // 4. Verificar como ficaria na consulta da API
    console.log('\n4. Como apareceria na API:');
    const apiResult = await prisma.order.findUnique({
      where: { id: updatedOrder.id },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } },
        lastEditedAt: true
      }
    });
    
    console.log('Resultado da API:', JSON.stringify(apiResult, null, 2));
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testEditOrder();