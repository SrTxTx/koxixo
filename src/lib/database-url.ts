import { Prisma } from '@prisma/client'

// Função para garantir que a URL do banco sempre tenha prepared_statements=false
export const getDatabaseUrl = () => {
  // SEMPRE preferir DIRECT_URL em produção para evitar limites do pooler Supabase
  const baseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || ''
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL ou DIRECT_URL deve estar configurada')
  }
  
  // Remover qualquer prepared_statements existente
  let cleanUrl = baseUrl.replace(/[&?]prepared_statements=(true|false)/g, '')
  
  // Adicionar parâmetros de conexão otimizados para serverless
  const params = [
    'prepared_statements=false',
    'connection_limit=1',      // Limite de 1 conexão por instância serverless
    'pool_timeout=10',         // Timeout de 10s para pegar conexão do pool
    'connect_timeout=10',      // Timeout de 10s para conectar
  ]
  
  if (cleanUrl.includes('?')) {
    return `${cleanUrl}&${params.join('&')}`
  } else {
    return `${cleanUrl}?${params.join('&')}`
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