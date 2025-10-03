// Teste específico para verificar configuração de autenticação
const { PrismaClient } = require('@prisma/client');

// Replicar a função aqui para teste
function getDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL || ''
  
  // Remover qualquer prepared_statements existente
  let cleanUrl = baseUrl.replace(/[&?]prepared_statements=(true|false)/g, '')
  
  // Garantir que sempre termine com prepared_statements=false
  if (cleanUrl.includes('?')) {
    return `${cleanUrl}&prepared_statements=false`
  } else {
    return `${cleanUrl}?prepared_statements=false`
  }
}

function createAuthPrismaClient() {
  const databaseUrl = getDatabaseUrl()
  
  console.log('🔐 Criando cliente Prisma específico para autenticação')
  console.log('🔧 URL configurada:', databaseUrl.replace(/:[^:]*@/, ':***@'))
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error']
  })
}

async function testAuthPrisma() {
  console.log('=== TESTE CLIENTE PRISMA DE AUTENTICAÇÃO ===\n');
  
  try {
    console.log('1. Criando cliente específico para autenticação...');
    
    const authPrisma = createAuthPrismaClient();
    
    console.log('2. Testando busca de usuário...');
    
    const user = await authPrisma.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    });
    
    console.log('✅ Usuário encontrado:', user ? user.name : 'Não encontrado');
    
    console.log('3. Testando múltiplas consultas para simular prepared statements...');
    
    for (let i = 0; i < 3; i++) {
      const testUser = await authPrisma.user.findUnique({
        where: { email: 'admin@koxixo.com' }
      });
      console.log(`- Consulta ${i + 1}: ${testUser ? 'Sucesso' : 'Falha'}`);
    }
    
    await authPrisma.$disconnect();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    if (error.message?.includes('prepared statement')) {
      console.error('🚨 ERRO DE PREPARED STATEMENT AINDA PERSISTE');
    }
  }
}

testAuthPrisma();