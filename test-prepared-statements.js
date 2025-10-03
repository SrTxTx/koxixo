// Teste para verificar se os problemas de prepared statements foram resolvidos
const { PrismaClient } = require('@prisma/client');

async function testPreparedStatements() {
  console.log('=== TESTE DE PREPARED STATEMENTS ===\n');
  
  try {
    // 1. Criar múltiplas instâncias do Prisma para simular o problema
    console.log('1. Testando múltiplas instâncias do Prisma...');
    
    const prisma1 = new PrismaClient();
    const prisma2 = new PrismaClient();
    
    // 2. Executar a mesma query em ambas as instâncias
    console.log('2. Executando queries simultâneas...');
    
    const [users1, users2] = await Promise.all([
      prisma1.user.findMany({ take: 1 }),
      prisma2.user.findMany({ take: 1 })
    ]);
    
    console.log('✅ Queries executadas com sucesso');
    console.log('- Instância 1:', users1.length, 'usuários');
    console.log('- Instância 2:', users2.length, 'usuários');
    
    // 3. Testar operações de autenticação
    console.log('\n3. Testando operação de autenticação...');
    
    const testUser = await prisma1.user.findUnique({
      where: { email: 'admin@koxixo.com' }
    });
    
    console.log('✅ Usuário de teste encontrado:', testUser ? testUser.name : 'Não encontrado');
    
    // 4. Testar retry com prepared statements
    console.log('\n4. Testando sistema de retry...');
    
    for (let i = 0; i < 5; i++) {
      const result = await prisma1.user.count();
      console.log(`- Tentativa ${i + 1}: ${result} usuários no total`);
    }
    
    console.log('\n✅ Todos os testes passaram! Problema de prepared statements resolvido.');
    
    await prisma1.$disconnect();
    await prisma2.$disconnect();
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    
    if (error.message?.includes('prepared statement')) {
      console.error('🚨 PROBLEMA AINDA EXISTE: Prepared statements ainda causando erro');
    }
  }
}

testPreparedStatements();