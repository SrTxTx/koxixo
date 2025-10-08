#!/usr/bin/env node

/**
 * Script de build customizado para Vercel
 */

const { execSync } = require('child_process');

console.log('🚀 Iniciando build customizado para Vercel...');

try {
  // Verificar se as variáveis de ambiente estão configuradas
  console.log('🔍 Verificando variáveis de ambiente...');
  
  const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missingEnvs.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Variáveis de ambiente OK');
  
  // Gerar Prisma Client
  console.log('📝 Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Build Next.js
  console.log('🏗️ Building Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}