import { Prisma } from '@prisma/client'

// Função para garantir que a URL do banco sempre tenha prepared_statements=false
export const getDatabaseUrl = () => {
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

// Configurações específicas para produção na Vercel
export const getProductionConfig = (): Prisma.PrismaClientOptions => ({
  // Configurações de log otimizadas com tipos corretos
  log: process.env.NODE_ENV === 'development' 
    ? [
        { level: 'query', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ]
    : [
        { level: 'error', emit: 'stdout' }
      ],
    
  // Configurações para ambiente serverless
  errorFormat: 'pretty',
  
  // Configurações de datasource
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

console.log('🔧 Database URL configurada:', getDatabaseUrl().replace(/:[^:]*@/, ':***@'))