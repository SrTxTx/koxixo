import { PrismaClient } from '@prisma/client'
import { getDatabaseUrl, getProductionConfig } from './database-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração específica para resolver problemas de prepared statements
const createPrismaClient = () => {
  // Garantir que a URL sempre tenha prepared_statements=false
  const databaseUrl = getDatabaseUrl()
  console.log('🔧 Database URL configurada:', databaseUrl.replace(/:[^:]*@/, ':***@'))
  
  const config = {
    ...getProductionConfig(),
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }
  
  console.log('🔧 Criando cliente Prisma com configurações otimizadas')
  
  return new PrismaClient(config)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Função para criar uma instância isolada do Prisma (útil para operações críticas)
export const createIsolatedPrismaClient = () => {
  const databaseUrl = getDatabaseUrl()
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Função específica para autenticação - sempre cria nova instância
export const createAuthPrismaClient = () => {
  const databaseUrl = getDatabaseUrl()
  
  console.log('🔐 Criando cliente Prisma específico para autenticação')
  console.log('🔧 URL configurada:', databaseUrl.replace(/:[^:]*@/, ':***@'))
  
  // Configuração específica para auth em ambiente serverless
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error'],
    // Configurações específicas para evitar prepared statements em produção
    ...getProductionConfig()
  })

  // Auto-disconnect após uso em serverless
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Configurar auto-disconnect após timeout
    setTimeout(async () => {
      try {
        await client.$disconnect()
      } catch (error) {
        console.log('⚠️ Auto-disconnect error:', error)
      }
    }, 10000) // 10 segundos
  }

  return client
}

// Função para desconectar explicitamente (útil em serverless)
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma desconectado com sucesso')
  } catch (error) {
    console.log('⚠️ Erro ao desconectar Prisma:', error)
  }
}