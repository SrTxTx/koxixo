import { Prisma } from '@prisma/client'

// Função para garantir que a URL do banco sempre tenha prepared_statements=false
export const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || ''
  
  // Se já tem prepared_statements=false, retorna como está
  if (baseUrl.includes('prepared_statements=false')) {
    return baseUrl
  }
  
  // Se tem outros parâmetros, adiciona o prepared_statements=false
  if (baseUrl.includes('?')) {
    return `${baseUrl}&prepared_statements=false`
  }
  
  // Se não tem parâmetros, adiciona como primeiro
  return `${baseUrl}?prepared_statements=false`
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