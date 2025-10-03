import { PrismaClient } from '@prisma/client'
import { getProductionConfig } from './database-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração específica para resolver problemas de prepared statements
const createPrismaClient = () => {
  const config = getProductionConfig()
  
  console.log('🔧 Criando cliente Prisma com configurações otimizadas')
  
  return new PrismaClient(config)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
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