// Teste para verificar problemas na interface de pedidos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrdersAPI() {
  console.log('=== TESTE DA API DE PEDIDOS ===\n');
  
  try {
    // 1. Verificar dados no banco
    console.log('1. Verificando dados no banco...');
    const ordersDB = await prisma.order.findMany({
      include: {
        createdBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      },
      take: 3
    });
    
    console.log('Pedidos no banco:');
    ordersDB.forEach(order => {
      console.log(`- ID: ${order.id}`);
      console.log(`  Título: ${order.title}`);
      console.log(`  Criado por: ${order.createdBy.name}`);
      console.log(`  Editado por: ${order.lastEditedBy?.name || 'Nunca editado'}`);
      console.log(`  Data edição: ${order.lastEditedAt || 'Nunca editado'}`);
      console.log('');
    });
    
    // 2. Simular o que a API faz
    console.log('2. Simulando consulta da API...');
    const ordersAPI = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        dueDate: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        completedAt: true,
        deliveredAt: true,
        lastEditedAt: true,
        lastEditedById: true,
        createdBy: { select: { name: true } },
        rejectedBy: { select: { name: true } },
        lastEditedBy: { select: { name: true } }
      },
      take: 3
    });
    
    console.log('Dados que a API retornaria:');
    ordersAPI.forEach(order => {
      console.log(`- ID: ${order.id}`);
      console.log(`  Título: ${order.title}`);
      console.log(`  Criado por: ${order.createdBy.name}`);
      console.log(`  lastEditedBy: ${JSON.stringify(order.lastEditedBy)}`);
      console.log(`  lastEditedAt: ${order.lastEditedAt}`);
      console.log('');
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testOrdersAPI();