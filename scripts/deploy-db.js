#!/usr/bin/env node

/**
 * Script para configurar o banco de dados em produção
 * Execute após o primeiro deploy no Vercel
 */

const { execSync } = require('child_process');

console.log('🚀 Configurando banco de dados para produção...');

try {
  // Gerar schema do banco
  console.log('📝 Gerando schema...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Aplicar migrações
  console.log('🔄 Aplicando migrações...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Popular banco com dados iniciais
  console.log('🌱 Populando banco com dados iniciais...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('✅ Banco configurado com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao configurar banco:', error.message);
  process.exit(1);
}